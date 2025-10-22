-- ============================================================================
-- Script de Verificação da Estrutura de Pastas por Whitelabel
-- ============================================================================
-- Este script verifica se toda a infraestrutura de pastas está correta
-- ============================================================================

-- 1. Verificar Bucket Images
SELECT 
  '1. BUCKET IMAGES' as verificacao,
  id,
  name,
  public,
  CASE 
    WHEN public = true THEN '✅ Público (correto)'
    ELSE '❌ Privado (deve ser público)'
  END as status
FROM storage.buckets
WHERE id = 'Images';

-- 2. Verificar Trigger de Criação de Pastas
SELECT 
  '2. TRIGGER DE CRIAÇÃO' as verificacao,
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name = 'create_whitelabel_folder_trigger' THEN '✅ Ativo'
    ELSE '❌ Não encontrado'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'create_whitelabel_folder_trigger';

-- 3. Verificar Políticas RLS
SELECT 
  '3. POLÍTICAS RLS' as verificacao,
  policyname,
  cmd as operacao,
  '✅ Ativa' as status
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%Whitelabel%'
ORDER BY cmd;

-- 4. Verificar Pastas para Whitelabels
SELECT 
  '4. PASTAS DOS WHITELABELS' as verificacao,
  w.id as whitelabel_id,
  w.name as whitelabel_name,
  CASE 
    WHEN so.name IS NOT NULL THEN '✅ Pasta existe'
    ELSE '❌ Pasta NÃO existe (criar manualmente)'
  END as status_pasta,
  so.created_at as data_criacao_pasta
FROM whitelabels w
LEFT JOIN storage.objects so ON 
  so.bucket_id = 'Images' AND 
  so.name = w.id::text || '/.keep'
ORDER BY w.created_at;

-- 5. Verificar Logos Existentes
SELECT 
  '5. LOGOS EXISTENTES' as verificacao,
  w.id as whitelabel_id,
  w.name as whitelabel_name,
  CASE 
    WHEN w.logo_url IS NOT NULL THEN '✅ Logo configurada'
    ELSE 'ℹ️ Sem logo'
  END as status_logo,
  w.logo_url
FROM whitelabels w
ORDER BY w.created_at;

-- 6. Verificar Arquivos no Bucket
SELECT 
  '6. ARQUIVOS NO BUCKET' as verificacao,
  (storage.foldername(name))[1] as pasta_whitelabel,
  COUNT(*) as total_arquivos,
  string_agg(DISTINCT SPLIT_PART(name, '/', -1), ', ') as arquivos
FROM storage.objects
WHERE bucket_id = 'Images'
GROUP BY (storage.foldername(name))[1]
ORDER BY pasta_whitelabel;

-- 7. Verificar Integridade (Whitelabels sem pasta)
SELECT 
  '7. WHITELABELS SEM PASTA' as verificacao,
  w.id as whitelabel_id,
  w.name as whitelabel_name,
  '❌ AÇÃO NECESSÁRIA: Criar pasta' as status
FROM whitelabels w
LEFT JOIN storage.objects so ON 
  so.bucket_id = 'Images' AND 
  so.name = w.id::text || '/.keep'
WHERE so.name IS NULL;

-- 8. Resumo Geral
SELECT 
  '8. RESUMO GERAL' as verificacao,
  (SELECT COUNT(*) FROM whitelabels) as total_whitelabels,
  (SELECT COUNT(DISTINCT (storage.foldername(name))[1]) 
   FROM storage.objects 
   WHERE bucket_id = 'Images' AND name LIKE '%/.keep') as total_pastas_criadas,
  (SELECT COUNT(*) FROM whitelabels WHERE logo_url IS NOT NULL) as total_com_logo,
  CASE 
    WHEN (SELECT COUNT(*) FROM whitelabels) = 
         (SELECT COUNT(DISTINCT (storage.foldername(name))[1]) 
          FROM storage.objects 
          WHERE bucket_id = 'Images' AND name LIKE '%/.keep')
    THEN '✅ TODOS OS WHITELABELS TÊM PASTAS'
    ELSE '⚠️ EXISTEM WHITELABELS SEM PASTA'
  END as status_geral;

-- ============================================================================
-- AÇÕES CORRETIVAS (Execute apenas se necessário)
-- ============================================================================

-- Se houver whitelabels sem pasta, execute este bloco:
/*
DO $$
DECLARE
  whitelabel_record RECORD;
BEGIN
  FOR whitelabel_record IN 
    SELECT w.id 
    FROM whitelabels w
    LEFT JOIN storage.objects so ON 
      so.bucket_id = 'Images' AND 
      so.name = w.id::text || '/.keep'
    WHERE so.name IS NULL
  LOOP
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES (
      'Images',
      whitelabel_record.id::text || '/.keep',
      NULL,
      '{"folder_marker": true}'::jsonb
    )
    ON CONFLICT (bucket_id, name) DO NOTHING;
    
    RAISE NOTICE 'Pasta criada para whitelabel: %', whitelabel_record.id;
  END LOOP;
END $$;
*/

-- Se o bucket não estiver público, execute:
/*
UPDATE storage.buckets
SET public = true
WHERE id = 'Images';
*/
