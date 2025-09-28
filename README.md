# O Construtor de Pontes

Experimento interativo em p5.js baseado na ideia: conectar duas "ilhas" criando uma ponte de elos sem tocar obstáculos.

## Como usar
1. Abra `index.html` em um navegador moderno (Chrome/Edge/Firefox). Se nada aparecer além do título e timer, veja a seção "Solução de problemas".
2. Clique ou toque na tela para adicionar pontos (elos) que formam a ponte.
3. Conecte a primeira ilha (esquerda) à segunda (direita).
4. Ao completar, uma animação percorre a ponte e a mensagem aparece.
5. Pressione `R` para reiniciar.

## Timer
Há um countdown de 1 minuto. Se o tempo acabar antes da conclusão, aparece a mensagem de tempo esgotado e você pode reiniciar com `R`.

## Solução de problemas
- Se o canvas (ilhas, obstáculos) não aparece e o cronômetro não anda: provavelmente o p5.js não foi carregado.
  - Verifique se está online (CDN: cdnjs).
  - Extensões de bloqueio (firewall, adblock estrito) podem impedir.
  - Abra o DevTools (F12) e veja erros na aba Console / Network.
- Para ambiente totalmente offline, baixe `p5.min.js` e substitua a tag:
  ```html
  <script src="libs/p5.min.js"></script>
  ```
- Integrity/SRI foi removido para evitar bloqueio local sem HTTPS.
- Se usar VSCode, rodar um servidor simples ajuda (ex.: extensão Live Server) evitando restrições de arquivo local.

## Estrutura
```
index.html   -> página principal e inclusão do p5.js
style.css    -> estilos e camadas de UI
sketch.js    -> lógica p5.js
conceito.txt -> descrição conceitual original
```

## Customização rápida
- Duração do timer: alterar `timeLimitMs` em `sketch.js`.
- Raio das ilhas: ajuste `r` em `initScene()`.
- Cor das ilhas: altere chamadas `drawIslandShape(...)`.
- Espessura da ponte: `strokeWeight` em `drawExistingBridge()`.

## Próximas melhorias sugeridas
- Barra de progresso do tempo.
- Undo (remover último elo) com Backspace.
- Sons leves ao adicionar elo / concluir / falhar.
- Modo difícil: aumenta obstáculos a cada 15s.

---
Feito com p5.js ♥
