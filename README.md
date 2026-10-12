# ROUTE OPTIMIZER

Sistema de otimização de rotas para entregas da **Cristina Araujo**, desenvolvido com HTML5, CSS3 e JavaScript puro.

## Características

- ✅ **Cálculo de rotas** com opção de otimização automática ou ordem manual
- ✅ **Gestão de clientes** (base de dados persistente)
- ✅ **Gestão de pontos de partida** (locais guardados)
- ✅ **Seleção de clientes para cada rota**
- ✅ Geocoding com OpenStreetMap/Nominatim (sem Google Maps)
- ✅ Routing com OSRM (com fallback para Haversine)
- ✅ **Estimativa de custos de portagens** (média Portugal)
- ✅ Interface premium com design verde e azul escuro
- ✅ **Proteção por palavra-passe** (palavra-passe obrigatória em cada acesso)
- ✅ Interface mobile-first com dark mode
- ✅ Importação de clientes via CSV
- ✅ Exportação de clientes e rotas para CSV
- ✅ Armazenamento local (LocalStorage)
- ✅ Histórico de rotas
- ✅ ETA calculations
- ✅ Marcação de entregas concluídas
- ✅ Pesquisa de clientes por nome

## Como Usar

### Primeiro Acesso

1. Abra o ficheiro `index.html` diretamente no navegador
2. **Defina uma palavra-passe** para proteger o acesso
3. A palavra-passe fica guardada no navegador

### Uso Diário

1. Abra o site
2. **Introduza a palavra-passe** (obrigatório em cada acesso)
3. **Gerir Clientes** (primeira vez):
   - Clique em "GERIR CLIENTES"
   - Adicione clientes manualmente ou importe via CSV
   - Os clientes ficam guardados permanentemente
4. **Gerir Pontos de Partida** (primeira vez):
   - No campo "PONTO DE PARTIDA", clique no botão 🏠
   - Adicione locais como "Armazém", "Escritório", "Casa"
   - Os locais ficam guardados permanentemente
5. **Criar Rota**:
   - Clique em "+ NOVA ROTA"
   - Selecione o ponto de partida clicando em 🏠
   - Ou use o botão 📍 para localização atual
   - Ou introduza uma morada manualmente
   - Clique em "+ SELECIONAR CLIENTES"
   - Selecione os clientes para esta rota específica
   - Ou adicione paragens manualmente
6. **Configurar Otimização**:
   - Marque "Otimizar ordem das paragens" para o sistema encontrar a rota mais rápida
   - Desmarque para manter a ordem que você selecionou
7. Configure o tempo médio por entrega e hora de início
8. Clique em "CALCULAR ROTA"
9. Visualize a rota calculada no ecrã:
   - Distância total em km
   - Tempo estimado
   - Número de paragens
   - Estimativa de custos de portagens (média Portugal: €0.12/km)
10. Marque as entregas como concluídas
11. Guarde ou exporte a rota
12. Clique em "SAIR" quando terminar

### Fluxo de Trabalho

**Gestão de Clientes:**
- Adicione clientes uma vez
- Ficam guardados permanentemente
- Pode editar, eliminar ou exportar
- Importe via CSV para adicionar muitos de uma vez

**Gestão de Pontos de Partida:**
- Adicione locais de partida uma vez (Armazém, Escritório, Casa, etc.)
- Ficam guardados permanentemente
- Selecione facilmente para cada rota
- Pode eliminar locais que não usa mais

**Criação de Rotas:**
- Cada rota é independente
- Selecione o ponto de partida guardado
- Selecione apenas os clientes para essa rota
- Pode criar múltiplas rotas com clientes diferentes
- Os clientes e locais na base de dados não são afetados

## Estrutura do Projeto

```
RotasCA/
├── index.html          # Página principal
├── css/
│   └── style.css      # Estilos
├── js/
│   ├── storage.js     # Módulo de armazenamento (LocalStorage)
│   ├── geocoder.js    # Módulo de geocoding (Nominatim)
│   ├── routing.js     # Módulo de routing (OSRM + Haversine)
│   ├── optimizer.js   # Algoritmo de otimização
│   ├── map.js         # Integração com Leaflet
│   └── app.js         # Lógica principal da aplicação
└── README.md          # Este ficheiro
```

## Tecnologias

- **HTML5**: Estrutura da página
- **CSS3**: Estilos com dark mode e design responsivo
- **JavaScript (ES6+)**: Lógica da aplicação
- **Leaflet**: Mapas interativos (via CDN)
- **OpenStreetMap/Nominatim**: Geocoding
- **OSRM**: Routing de rotas
- **SheetJS**: Importação de Excel (via CDN)

## API's Externas Utilizadas

Todas as APIs são gratuitas e open-source:

- **Nominatim**: https://nominatim.openstreetmap.org
  - Geocoding de endereços
  - Limite: 1 requisição por segundo

- **OSRM**: https://router.project-osrm.org
  - Cálculo de rotas reais
  - Fallback para Haversine se indisponível

## Funcionalidades

### Otimização de Rotas

O sistema utiliza um algoritmo híbrido:
1. **Nearest Neighbor**: Encontra a solução inicial
2. **2-opt**: Melhora a solução através de trocas de arestas

### Geocoding

- Cache de resultados para evitar requisições duplicadas
- Suporte para coordenadas manuais
- Rate limiting para respeitar limites da API

### Routing

- Prioriza distâncias reais por estrada (OSRM)
- Fallback automático para distância em linha reta (Haversine)
- Matriz de distâncias com cache

### Armazenamento

- Todas as rotas guardadas localmente no navegador
- Cache de geocoding e distâncias
- Histórico das últimas 50 rotas

## Formato de Importação CSV

O CSV deve ter cabeçalhos com os nomes das colunas. Exemplo:

```csv
Nome,Morada,Código Postal,Localidade,Notas
João Silva,Rua Example 123,2615-505,Alverca,Tocar à campainha
Maria Santos,Rua Example 456,2600-000,Lisboa,
```

## Compatibilidade

- Chrome/Edge (recomendado)
- Firefox
- Safari
- Navegadores móveis modernos

## Privacidade

- Todos os dados são armazenados localmente no navegador
- Não são enviados para servidores externos
- Não requer conta ou registo
- **Protegido por palavra-passe** (armazenada localmente com hash)
- Palavra-passe obrigatória em cada acesso
- Ao clicar "SAIR", volta ao ecrã de login

## Segurança

- A palavra-passe é guardada localmente com hash
- **Palavra-passe obrigatória em cada acesso ao site**
- Ninguém pode aceder aos dados sem a palavra-passe
- Mesmo no GitHub Pages, cada utilizador tem os SEUS dados protegidos
- A palavra-passe fica apenas no dispositivo onde foi definida
- Se limpar o cache do navegador, terá de definir a palavra-passe novamente

## Limitações

- Otimização para um único veículo
- Sem janelas horárias (pode ser adicionado futuramente)
- Sem restrições de capacidade (pode ser adicionado futuramente)
- Dependente de conexão internet para geocoding e routing

## Melhorias Futuras

- [ ] Suporte para múltiplos veículos
- [ ] Janelas horárias de entrega
- [ ] Prioridades de clientes
- [ ] Estatísticas e relatórios
- [ ] Modo offline completo
- [ ] Sincronização entre dispositivos

## Licença

Este projeto é open-source e pode ser utilizado livremente.

## Suporte

Para questões ou problemas, verifique se:
- O navegador suporta Geolocation API
- Tem conexão à internet para geocoding/routing
- As APIs externas estão operacionais
