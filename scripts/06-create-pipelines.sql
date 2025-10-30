-- =====================================================
-- 06: CREATE PIPELINES SYSTEM
-- Sistema de pipelines personalizáveis para CRM
-- =====================================================

-- Criar tabela de pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whitelabel_id UUID NOT NULL REFERENCES whitelabels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    color TEXT DEFAULT '#3b82f6', -- Cor para identificação visual
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_default_pipeline_per_whitelabel
        UNIQUE (whitelabel_id, is_default)
        WHERE is_default = true
);

-- Criar tabela de stages (estágios/status de cada pipeline)
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_position INTEGER NOT NULL, -- Ordem de exibição
    color TEXT DEFAULT '#6366f1', -- Cor da coluna no kanban

    -- Contabilizações especiais
    counts_as_meeting BOOLEAN DEFAULT false, -- Se contabiliza como reunião
    counts_as_sale BOOLEAN DEFAULT false, -- Se contabiliza como venda
    requires_sdr BOOLEAN DEFAULT false, -- Se exige SDR atribuído
    requires_closer BOOLEAN DEFAULT false, -- Se exige Closer atribuído
    requires_deal_value BOOLEAN DEFAULT false, -- Se exige valor do deal

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_stage_order_per_pipeline
        UNIQUE (pipeline_id, order_position),
    CONSTRAINT unique_stage_name_per_pipeline
        UNIQUE (pipeline_id, name)
);

-- Adicionar pipeline_id à tabela contacts
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL;

-- Adicionar stage_id à tabela contacts (substitui o funnel_stage antigo)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pipelines_whitelabel ON pipelines(whitelabel_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_default ON pipelines(whitelabel_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON pipeline_stages(pipeline_id, order_position);
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline ON contacts(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_contacts_stage ON contacts(stage_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pipelines
CREATE POLICY "Users can view pipelines from their whitelabel"
    ON pipelines FOR SELECT
    USING (whitelabel_id IN (
        SELECT whitelabel_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert pipelines in their whitelabel"
    ON pipelines FOR INSERT
    WITH CHECK (whitelabel_id IN (
        SELECT whitelabel_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update pipelines from their whitelabel"
    ON pipelines FOR UPDATE
    USING (whitelabel_id IN (
        SELECT whitelabel_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete pipelines from their whitelabel"
    ON pipelines FOR DELETE
    USING (whitelabel_id IN (
        SELECT whitelabel_id FROM users WHERE id = auth.uid()
    ));

-- Políticas RLS para pipeline_stages
CREATE POLICY "Users can view stages from their whitelabel pipelines"
    ON pipeline_stages FOR SELECT
    USING (pipeline_id IN (
        SELECT id FROM pipelines WHERE whitelabel_id IN (
            SELECT whitelabel_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert stages in their whitelabel pipelines"
    ON pipeline_stages FOR INSERT
    WITH CHECK (pipeline_id IN (
        SELECT id FROM pipelines WHERE whitelabel_id IN (
            SELECT whitelabel_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can update stages from their whitelabel pipelines"
    ON pipeline_stages FOR UPDATE
    USING (pipeline_id IN (
        SELECT id FROM pipelines WHERE whitelabel_id IN (
            SELECT whitelabel_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete stages from their whitelabel pipelines"
    ON pipeline_stages FOR DELETE
    USING (pipeline_id IN (
        SELECT id FROM pipelines WHERE whitelabel_id IN (
            SELECT whitelabel_id FROM users WHERE id = auth.uid()
        )
    ));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_updated_at_trigger
    BEFORE UPDATE ON pipelines
    FOR EACH ROW
    EXECUTE FUNCTION update_pipeline_updated_at();

CREATE TRIGGER pipeline_stage_updated_at_trigger
    BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_pipeline_updated_at();

-- Função para criar pipeline padrão com stages básicos
CREATE OR REPLACE FUNCTION create_default_pipeline(p_whitelabel_id UUID)
RETURNS UUID AS $$
DECLARE
    v_pipeline_id UUID;
BEGIN
    -- Criar pipeline padrão
    INSERT INTO pipelines (whitelabel_id, name, description, is_default, color)
    VALUES (
        p_whitelabel_id,
        'Pipeline Padrão',
        'Pipeline de vendas padrão com estágios básicos',
        true,
        '#3b82f6'
    )
    RETURNING id INTO v_pipeline_id;

    -- Criar stages padrão
    INSERT INTO pipeline_stages (pipeline_id, name, order_position, color, counts_as_meeting, counts_as_sale) VALUES
    (v_pipeline_id, 'Novo Lead', 1, '#94a3b8', false, false),
    (v_pipeline_id, 'Contatado', 2, '#60a5fa', false, false),
    (v_pipeline_id, 'Reunião Agendada', 3, '#a78bfa', true, false),
    (v_pipeline_id, 'Negociação', 4, '#fb923c', false, false),
    (v_pipeline_id, 'Ganho', 5, '#4ade80', false, true),
    (v_pipeline_id, 'Perdido', 6, '#f87171', false, false),
    (v_pipeline_id, 'Desqualificado', 7, '#71717a', false, false);

    RETURN v_pipeline_id;
END;
$$ LANGUAGE plpgsql;

-- Função para migrar contacts existentes para o novo sistema
CREATE OR REPLACE FUNCTION migrate_contacts_to_pipelines()
RETURNS void AS $$
DECLARE
    wl_record RECORD;
    default_pipeline_id UUID;
    stage_mapping JSONB;
BEGIN
    -- Para cada whitelabel
    FOR wl_record IN SELECT id FROM whitelabels LOOP
        -- Criar pipeline padrão
        default_pipeline_id := create_default_pipeline(wl_record.id);

        -- Criar mapeamento de status antigo para stage_id novo
        SELECT jsonb_object_agg(
            CASE order_position
                WHEN 1 THEN 'new_lead'
                WHEN 2 THEN 'contacted'
                WHEN 3 THEN 'meeting'
                WHEN 4 THEN 'negotiation'
                WHEN 5 THEN 'won'
                WHEN 6 THEN 'lost'
                WHEN 7 THEN 'disqualified'
            END,
            id::text
        ) INTO stage_mapping
        FROM pipeline_stages
        WHERE pipeline_id = default_pipeline_id;

        -- Migrar contacts
        UPDATE contacts c
        SET
            pipeline_id = default_pipeline_id,
            stage_id = (stage_mapping->>c.funnel_stage)::UUID
        WHERE c.whitelabel_id = wl_record.id
        AND c.pipeline_id IS NULL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar migração
SELECT migrate_contacts_to_pipelines();

-- Comentários para documentação
COMMENT ON TABLE pipelines IS 'Pipelines personalizáveis para cada whitelabel';
COMMENT ON TABLE pipeline_stages IS 'Estágios/status de cada pipeline, com configurações de contabilização';
COMMENT ON COLUMN pipeline_stages.counts_as_meeting IS 'Se true, contatos neste stage são contabilizados como reunião realizada';
COMMENT ON COLUMN pipeline_stages.counts_as_sale IS 'Se true, contatos neste stage são contabilizados como venda fechada';
COMMENT ON COLUMN pipeline_stages.requires_sdr IS 'Se true, exige que um SDR seja atribuído ao contato';
COMMENT ON COLUMN pipeline_stages.requires_closer IS 'Se true, exige que um Closer seja atribuído ao contato';
COMMENT ON COLUMN pipeline_stages.requires_deal_value IS 'Se true, exige que o valor do deal seja preenchido';
