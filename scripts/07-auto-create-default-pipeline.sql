-- =====================================================
-- 07: AUTO-CREATE DEFAULT PIPELINE FOR NEW WHITELABELS
-- Criar automaticamente pipeline padrão ao criar whitelabel
-- =====================================================

-- Função para criar automaticamente um pipeline padrão para um whitelabel
CREATE OR REPLACE FUNCTION auto_create_default_pipeline()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar pipeline padrão para o novo whitelabel
    PERFORM create_default_pipeline(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que executa após inserir um novo whitelabel
DROP TRIGGER IF EXISTS trigger_auto_create_pipeline ON whitelabels;
CREATE TRIGGER trigger_auto_create_pipeline
    AFTER INSERT ON whitelabels
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_default_pipeline();

-- Criar pipelines para whitelabels existentes que não têm pipeline
DO $$
DECLARE
    wl_record RECORD;
    pipeline_count INTEGER;
BEGIN
    -- Para cada whitelabel
    FOR wl_record IN SELECT id FROM whitelabels LOOP
        -- Verificar se já tem pipeline
        SELECT COUNT(*) INTO pipeline_count
        FROM pipelines
        WHERE whitelabel_id = wl_record.id;

        -- Se não tem pipeline, criar
        IF pipeline_count = 0 THEN
            PERFORM create_default_pipeline(wl_record.id);
            RAISE NOTICE 'Pipeline padrão criado para whitelabel %', wl_record.id;
        END IF;
    END LOOP;
END $$;

-- Verificar pipelines criados
SELECT
    w.id as whitelabel_id,
    w.name as whitelabel_name,
    p.id as pipeline_id,
    p.name as pipeline_name,
    p.is_default,
    COUNT(ps.id) as stages_count
FROM whitelabels w
LEFT JOIN pipelines p ON p.whitelabel_id = w.id
LEFT JOIN pipeline_stages ps ON ps.pipeline_id = p.id
GROUP BY w.id, w.name, p.id, p.name, p.is_default
ORDER BY w.name, p.created_at;
