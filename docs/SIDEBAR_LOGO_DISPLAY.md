# Logo do Whitelabel na Sidebar

## Implementação

A logo do whitelabel agora é exibida na sidebar quando está aberta, substituindo o ícone genérico quando uma logo personalizada está configurada.

## Localização

**Arquivo**: `components/app-sidebar.tsx`

## Comportamento

### Quando a Logo está Configurada (`whitelabel.logoUrl` existe)

#### Sidebar Aberta
- ✅ Exibe a logo completa (40x40px)
- ✅ Logo dentro de um container com fundo suave (`bg-sidebar-accent/50`)
- ✅ Nome do whitelabel ao lado
- ✅ Texto "Dashboard" abaixo do nome
- ✅ Suporte a SVG com `unoptimized`

#### Sidebar Colapsada (Ícone)
- ✅ Exibe a logo pequena (32x32px)
- ✅ Container redondo com fundo suave
- ✅ Tooltip mostra o nome do whitelabel

### Quando a Logo NÃO está Configurada (Fallback)

#### Sidebar Aberta
- ✅ Exibe ícone de Dashboard com cor do whitelabel (`brandColor`)
- ✅ Nome do whitelabel ao lado
- ✅ Texto "Dashboard" abaixo do nome

#### Sidebar Colapsada
- ✅ Ícone pequeno com cor do whitelabel
- ✅ Tooltip mostra o nome do whitelabel

## Código Implementado

```tsx
{whitelabel.logoUrl ? (
  // Logo personalizada
  <>
    {/* Collapsed: Small logo */}
    <div className="aspect-square size-8 items-center justify-center rounded-lg overflow-hidden shrink-0 group-data-[collapsible=icon]:flex hidden bg-sidebar-accent/50">
      <Image
        src={whitelabel.logoUrl}
        alt={whitelabel.name}
        width={32}
        height={32}
        className="object-cover w-full h-full"
        unoptimized={whitelabel.logoUrl.endsWith('.svg')}
      />
    </div>
    
    {/* Expanded: Full logo */}
    <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden w-full">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-sidebar-accent/50">
        <Image
          src={whitelabel.logoUrl}
          alt={whitelabel.name}
          width={40}
          height={40}
          className="object-cover w-full h-full"
          unoptimized={whitelabel.logoUrl.endsWith('.svg')}
        />
      </div>
      <div className="flex flex-col gap-0.5 leading-none flex-1 min-w-0">
        <span className="font-semibold truncate">{whitelabel.name}</span>
        <span className="text-xs text-muted-foreground">Dashboard</span>
      </div>
    </div>
  </>
) : (
  // Fallback: Ícone com brandColor
  <>
    <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground shrink-0"
      style={{ backgroundColor: whitelabel.brandColor }}>
      <LayoutDashboard className="size-4" />
    </div>
    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
      <span className="font-semibold">{whitelabel.name}</span>
      <span className="text-xs text-muted-foreground">Dashboard</span>
    </div>
  </>
)}
```

## Características Técnicas

### Suporte a Formatos
- ✅ **PNG**: Renderização normal
- ✅ **JPEG**: Renderização normal
- ✅ **WebP**: Renderização normal
- ✅ **SVG**: Renderização com `unoptimized={true}`

### Formato de Imagem Recomendado
⚠️ **IMPORTANTE**: Por usar `object-cover`, é **essencial** que a logo seja quadrada (mesma largura e altura).
- ✅ **Logo Quadrada** (512x512px): Preenche perfeitamente sem cortar partes importantes
- ⚠️ **Logo Retangular** (800x600px): Será cortada nas bordas para preencher o espaço quadrado
- 💡 **Dica**: O sistema já valida e exige formato quadrado no upload, garantindo resultado perfeito

### Comportamento Visual
- **object-cover**: A imagem preenche completamente o container
- **Sem distorção**: A proporção da imagem é mantida
- **Centralizado**: O corte (se houver) é feito de forma centralizada
- **Sem espaços vazios**: Visual mais impactante e profissional

### Responsividade
- ✅ Adapta-se ao estado da sidebar (aberta/colapsada)
- ✅ Usa classes do Tailwind com `group-data-[collapsible=icon]`
- ✅ Trunca texto longo do nome do whitelabel

### Performance
- ✅ Usa `next/image` para otimização automática
- ✅ Lazy loading de imagens
- ✅ Cache automático de imagens

### Acessibilidade
- ✅ Atributo `alt` com nome do whitelabel
- ✅ Tooltip quando sidebar está colapsada
- ✅ Contraste adequado com fundo

## Estilos Visuais

### Container da Logo
- **Fundo**: `bg-sidebar-accent/50` (transparente, adapta-se ao tema)
- **Borda**: Arredondada (`rounded-lg`)
- **Overflow**: `overflow-hidden` (corta conteúdo excedente)
- **Tamanho**: 
  - Colapsado: 32x32px
  - Aberto: 40x40px

### Comportamento da Imagem
- **Object-fit**: `object-cover` (preenche todo o espaço)
- **Dimensões**: `w-full h-full` (100% do container)
- **Efeito**: A logo preenche completamente o espaço, podendo cortar bordas se necessário
- **Benefício**: Visual mais impactante e profissional, sem espaços vazios

### Texto
- **Nome do Whitelabel**: `font-semibold` com `truncate`
- **Subtítulo**: `text-xs text-muted-foreground`

## Fluxo de Uso

```
1. Usuário faz upload da logo em Configurações
   ↓
2. Logo salva em: Images/{whitelabel_id}/logo.{ext}
   ↓
3. URL pública salva em whitelabels.logo_url
   ↓
4. Hook useAuth() retorna whitelabel.logoUrl
   ↓
5. AppSidebar renderiza logo automaticamente
   ↓
6. Logo exibida no topo da sidebar
```

## Teste Manual

### Como Testar

1. **Sem Logo**:
   - Acesse o dashboard sem ter feito upload de logo
   - ✅ Deve mostrar ícone com brandColor
   - ✅ Sidebar colapsada deve mostrar apenas o ícone

2. **Com Logo PNG/JPEG**:
   - Faça upload de uma logo PNG ou JPEG em Configurações
   - Recarregue a página
   - ✅ Logo deve aparecer no topo da sidebar
   - ✅ Sidebar colapsada deve mostrar logo pequena

3. **Com Logo SVG**:
   - Faça upload de uma logo SVG
   - Recarregue a página
   - ✅ Logo SVG deve renderizar corretamente
   - ✅ Sem distorções ou pixelização

4. **Alternar Sidebar**:
   - Clique no botão de toggle da sidebar
   - ✅ Transição suave entre estados
   - ✅ Logo adapta-se ao tamanho

5. **Tema Claro/Escuro**:
   - Alterne entre temas
   - ✅ Logo deve ser visível em ambos
   - ✅ Fundo adapta-se ao tema

## Melhorias Futuras

1. **Skeleton Loading**: Mostrar placeholder enquanto logo carrega
2. **Error Handling**: Fallback se logo falhar ao carregar
3. **Multiple Sizes**: Diferentes resoluções para diferentes telas
4. **Animation**: Transição suave ao trocar de logo
5. **Preview em Tempo Real**: Mostrar logo na sidebar ao fazer upload

## Integração com Sistema de Upload

A logo exibida na sidebar é a mesma configurada em:
- **Página**: `/dashboard/Configuracoes`
- **Card**: "Configurações do Negócio"
- **Componente**: `LogoUpload`

Quando uma nova logo é enviada:
1. Upload para Supabase Storage
2. URL salva no banco de dados
3. **É necessário recarregar a página** para ver a nova logo na sidebar
4. (Futuramente: atualização em tempo real via websocket/polling)

## Compatibilidade

- ✅ Next.js 14+
- ✅ React 18+
- ✅ Tailwind CSS
- ✅ Shadcn/ui Sidebar component
- ✅ Todos os navegadores modernos
