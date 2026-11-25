Crie um script Node com Playwright que tire prints de comparação de três portais de governo. Isso é material pra uma apresentação, então não crie site nem página, só as imagens.

Portais e serviço (renovação da carteira de motorista):
- gov.br: https://www.gov.br (buscar "renovar CNH")
- GOV.UK: https://www.gov.uk/renew-driving-licence
- gov.pt (substituiu o antigo ePortugal): https://www.gov.pt (buscar "renovar carta de condução")

Pra cada portal, capture: página inicial, resultado da busca e página do serviço. Só páginas públicas, sem login e sem enviar formulário.
Dois tamanhos: desktop 1440x900 e celular 390x844 (deviceScaleFactor 2). Só a área visível da tela, que é o que cabe num slide.
Feche banners de cookies antes do print. Espere networkidle e mais 2 segundos.
Se uma URL não funcionar, use a busca do próprio site como um usuário faria. Se falhar mesmo assim, avise no console e siga.
Salve em prints/ com nomes tipo govbr_busca_mobile.png e gere prints/urls.md com a URL e a data de cada print.