# PetMed — Plano de Design de Interface Mobile

## Direção do produto

O PetMed é um aplicativo local-first para tutores de pets acompanharem doses e horários de medicamentos. A experiência deve ser calma, confiável, acolhedora e clínica sem parecer hospitalar. O princípio central é: **abrir, identificar o que precisa ser feito agora, tocar uma vez e concluir**.

A interface assume uso em orientação portrait 9:16 e prioriza operação com uma mão. O conteúdo essencial aparece no primeiro terço da tela, as ações primárias permanecem em áreas de alcance confortável e todos os alvos interativos têm pelo menos 44 × 44 px.

## Lista de telas

| Tela | Conteúdo principal | Funcionalidade |
|---|---|---|
| Hoje | Saudação contextual, resumo do dia, card dominante da próxima dose e lista cronológica de doses | Administrar dose com um toque, visualizar status, navegar para detalhes |
| Pets | Lista de pets com avatar, espécie, peso, quantidade de medicamentos e próxima dose | Abrir perfil, adicionar novo pet |
| Perfil do pet | Identidade do pet, dados básicos, medicamentos ativos e histórico resumido | Editar pet, iniciar inclusão de medicamento, consultar agenda |
| Medicamento | Nome, dose, instrução, horários, dias e status | Administrar, editar, pausar ou excluir com confirmação |
| Adicionar medicamento | Formulário com nome, dose, unidade, instruções, horários e dias | Validar e salvar medicamento |
| Histórico | Lista filtrável de doses administradas, perdidas, ignoradas e reagendadas | Consultar período, status e detalhes da dose |
| Mais | Preferências locais, lembretes, aparência e informações do produto | Configurar comportamento da experiência |
| Bottom sheet de confirmação | Dose, pet, medicamento, horário e ação confirmada | Confirmar administração sem perder contexto |

## Estrutura da navegação

A navegação principal usa quatro abas no padrão iOS: **Hoje**, **Pets**, **Histórico** e **Mais**. A aba Hoje é a entrada padrão. Telas de criação, detalhe e edição usam navegação empilhada com botão de voltar no topo; ações críticas usam confirmação em bottom sheet ou alert nativo.

## Hierarquia visual da tela Hoje

A tela começa com contexto curto e útil: “Bom dia, Daniela” e a data atual. Em seguida, apresenta o resumo “2 doses hoje” e um card **Próxima dose** com o horário em maior destaque, avatar do pet, medicamento, dose, instrução opcional e botão primário **DAR AGORA**. Abaixo, a agenda do dia é organizada por horário e status, sem depender somente de cor.

O estado atual combina ícone, texto e cor: pendente com círculo vazio, agora com indicador ativo, administrada com check, perdida com alerta, ignorada com traço e reagendada com atualização. A dose administrada permanece visível com feedback positivo e horário de conclusão.

## Componentes prioritários

| Componente | Especificação |
|---|---|
| Card de próxima dose | Superfície branca, radius 16, padding 16, sombra baixa opcional; horário em 28–32 px; CTA verde principal |
| Card de medicamento | Ordem fixa: horário → pet → medicamento → dose → ação |
| Pet avatar | Circular; tamanho 40, 56, 72 ou 96 px; fallback vetorial simples, sem depender de emoji |
| Botão primário | Altura 48 px, radius 12, texto 15 px semibold |
| Campo de formulário | Altura 52 px, radius 12, label persistente e borda de 1 px |
| Seletor de horário | Chips ou linhas compactas com horários editáveis e ação “Adicionar horário” |
| Bottom sheet | Radius superior 24 px, fundo de superfície, ação primária dominante e alternativa secundária clara |

## Fluxos principais

### Administrar dose

1. O tutor abre o app na aba Hoje.
2. O card Próxima dose mostra horário, pet, medicamento e dose.
3. O tutor toca em **DAR AGORA**.
4. O app exibe confirmação contextual com os mesmos dados da dose.
5. O tutor confirma; o status muda para **Administrada**, aparece o horário de conclusão e há feedback háptico/sucesso.
6. A próxima dose passa a ocupar a posição dominante.

### Adicionar pet

1. O tutor abre Pets.
2. Toca em **ADICIONAR PET**.
3. Preenche nome, espécie e peso opcional; a foto pode ser adicionada em uma etapa posterior.
4. Salva e retorna à lista com o novo Pet Card.
5. O app oferece acesso direto para cadastrar o primeiro medicamento.

### Adicionar medicamento

1. O tutor entra no Perfil do pet.
2. Toca em **ADICIONAR MEDICAMENTO**.
3. Informa nome, dose e unidade.
4. Adiciona um ou mais horários sem duplicação.
5. Seleciona todos os dias, dias úteis ou dias personalizados.
6. Opcionalmente informa instrução, como “após a refeição”.
7. Toca em **SALVAR MEDICAMENTO** e retorna ao perfil com o medicamento ativo.

### Revisar histórico

1. O tutor abre Histórico.
2. Visualiza uma lista cronológica de doses.
3. Usa filtros compactos por pet, período ou status.
4. Toca em um item para consultar horário previsto, horário realizado e observação.

## Cores

A paleta principal segue o arquivo de produção: verde sálvia profundo `#2F7D6D` para ações, `#245F54` para pressed e `#E7F2EF` para seleção; fundo `#F7F9F8`; superfícies `#FFFFFF`; texto primário `#1F2926`; secundário `#65736E`; borda `#DDE5E2`; sucesso `#2E8B68`; atenção `#D99632`; erro `#C85A5A`; informação `#4D7EA8`.

O verde não será usado como único indicador de estado. Todos os estados terão ícone e texto. O visual será majoritariamente claro, com alto contraste e pouca ornamentação para reduzir carga cognitiva.

## Tipografia e espaçamento

A escala usa Inter quando disponível, com fallback nativo: display 32/40, h1 28/36, h2 24/32, h3 20/28, body 16/24, body small 14/20, caption 12/16 e button 15/20. O layout utiliza múltiplos de 4 px; o padding horizontal padrão é 16 px e a separação entre seções fica entre 24 e 32 px.

## Estado e persistência da primeira versão

A primeira versão usa dados locais e persistência no dispositivo, sem exigir conta ou sincronização em nuvem. O domínio central é composto por `Pet`, `Medication`, `MedicationSchedule`, `DoseEvent` e `MedicationStatus`. A tela Hoje deriva a próxima dose a partir dos eventos do dia; administrar uma dose atualiza o evento e registra o horário real.

## Acessibilidade e feedback

Textos críticos não dependerão apenas de cor. Botões terão rótulos verbais, ícones terão descrição quando necessários, campos terão labels visíveis e o contraste será mantido nas superfícies. Ações primárias usam feedback de pressão e háptico leve; conclusão de dose usa feedback de sucesso. A interface evita gestos ocultos para operações essenciais.
