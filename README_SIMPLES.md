# Experiência Interativa – Versão Resumida

Este repositório contém 3 mini-níveis criados para o processo seletivo da **Apple Developer Academy UFPE**.

| Nível | Nome | Objetivo rápido |
|------|------|-----------------|
| 1 | Construtor de Pontes | Conectar ilhas criando elos sem bater em obstáculos |
| 2 | Organizador de Ideias | Arrastar formas para a zona correta |
| 3 | Semente da Curiosidade | Coletar orbes para crescer a semente |

## Como Rodar
Opção rápida: abrir `index.html` no navegador.

Recomendado (servidor local):
```bash
python -m http.server 8080
# ou
npx serve .
```
Acesse: http://localhost:8080

## Controles
| Ação | Nível | Entrada |
|------|-------|---------|
| Adicionar elo | 1 | Clique/Toque |
| Desfazer elo | 1 | Backspace / botão Undo / clicar em elo |
| Arrastar forma | 2 | Clique e arraste |
| Mover semente | 3 | Mover o mouse |
| Reiniciar nível | Todos | R |
| Próxima fase | 1 e 2 (após concluir) | Botão “Próxima Fase” |

## Tempo
Cada nível tem 20 segundos. Barra de tempo e alerta visual nos 10s finais.

## Ajustes Rápidos (em `sketch.js`)
| O que | Onde |
|------|------|
| Tempo por nível | `levelTimeLimit` |
| Obstáculos iniciais (N1) | `baseObstacleCount` |
| Formas por tipo (N2) | `level2PerType` |
| Orbs necessárias (N3) | `level3Required` |

## Caso não carregue
Baixe `p5.min.js` e substitua a CDN no `index.html`:
```html
<script src="libs/p5.min.js"></script>
```

## Mais Detalhes
Veja o README completo para arquitetura, roadmap e contexto conceitual.

## Licença
CC BY-NC-SA 4.0 — uso não comercial com compartilhamento pela mesma licença. Leia o arquivo `LICENSE` para detalhes.

Boa avaliação! 🌱
