# PetMed — TODO

- [x] Configurar tokens visuais do design system PetMed no tema do Expo
- [x] Gerar e aplicar identidade visual e ícone do aplicativo
- [x] Implementar navegação principal Hoje, Pets, Histórico e Mais
- [x] Implementar domínio local de pets, medicamentos, horários e eventos de dose
- [x] Implementar persistência local com AsyncStorage
- [x] Implementar tela Hoje com próxima dose dominante e agenda do dia
- [x] Implementar ação DAR AGORA com confirmação e feedback de sucesso
- [x] Implementar lista de pets e fluxo de adicionar pet
- [x] Implementar perfil do pet e lista de medicamentos ativos
- [x] Implementar fluxo de adicionar medicamento com horários e dias
- [x] Implementar histórico de doses e filtros básicos
- [x] Adicionar estados de empty state, pending, administered, missed, skipped e rescheduled
- [x] Adicionar acessibilidade, áreas de toque e suporte a safe area
- [x] Validar TypeScript, lint e testes unitários
- [x] Validar o preview e ajustar problemas visuais ou de interação
- [ ] Criar checkpoint final antes da entrega

- [x] Cadastro completo de medicamento com nome, dosagem e unidade
- [x] Configuração de frequência, horários e duração do tratamento
- [x] Validação do formulário e estados de erro acessíveis
- [x] Persistência local e integração do medicamento cadastrado à agenda
- [x] Atualizar perfil do pet para listar medicamentos ativos
- [x] Validar o novo fluxo e criar checkpoint da funcionalidade

- [x] Migrar MVP local (AsyncStorage) para backend sincronizado (tRPC + MySQL/Drizzle)
- [x] Criar schema de pets, tratamentos, horários e ocorrências de dose com migration
- [x] Implementar petmedRouter (pets, treatments, doses) com validação Zod
- [x] Reescrever autenticação com estado OAuth assinado e sessão via API
- [x] Agendar notificações locais de dose (expo-notifications) com re-sync ao abrir a agenda
- [x] Proteger rotas com guarda central de autenticação e tela de login dedicada
- [x] Declarar telas de criação como modais e proteger theme-lab com __DEV__
- [x] Encerrar tratamento na UI com cancelamento dos lembretes locais

- [x] Marcar doses vencidas como "missed" automaticamente (lazy no servidor, janela de 2h)
- [ ] Validar fluxo OAuth de ponta a ponta em build standalone (scheme petmed://)
- [x] Documentar arquitetura monorepo (server/ na nuvem, app/ cliente tRPC)
