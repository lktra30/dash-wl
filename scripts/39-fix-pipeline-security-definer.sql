-- =====================================================
-- 39: FIX PIPELINE SECURITY DEFINER
-- Corrige funções de pipeline para usar SECURITY DEFINER
-- e bypassar RLS durante criação automática de whitelabels
-- =====================================================

-- Recriar função create_default_pipeline com SECURITY DEFINER
-- Isso permite que a função execute com privilégios elevados,
-- bypassando as políticas RLS durante a criação automática de pipelines
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar função auto_create_default_pipeline com SECURITY DEFINER
-- Isso garante que o trigger execute com privilégios elevados
CREATE OR REPLACE FUNCTION auto_create_default_pipeline()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar pipeline padrão para o novo whitelabel
    PERFORM create_default_pipeline(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar comentários explicativos
COMMENT ON FUNCTION create_default_pipeline IS
'Cria pipeline padrão com 7 stages básicos. Usa SECURITY DEFINER para bypassar RLS durante criação automática de whitelabels.';

COMMENT ON FUNCTION auto_create_default_pipeline IS
'Trigger function que cria automaticamente um pipeline padrão quando um novo whitelabel é criado. Usa SECURITY DEFINER para executar com privilégios elevados.';

-- Verificar se a correção foi aplicada
DO $$
BEGIN
    RAISE NOTICE 'Funções de pipeline atualizadas com SECURITY DEFINER';
    RAISE NOTICE 'Agora é possível criar whitelabels sem erro de RLS';
END $$;
