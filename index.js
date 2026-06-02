// ==========================================================================
// CONFIGURAÇÃO DO BOT TECHPULSE (CAPTURA RSS + INJEÇÃO NO SUPABASE VIA NODE.JS)
// ==========================================================================

// Resgata as credenciais das variáveis de ambiente com segurança do GitHub Secrets
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function executarAutomacao() {
    console.log(`⏰ Execução iniciada em: ${new Date().toLocaleString('pt-PT')}`);
    console.log("📡 Acedendo ao feed RSS do TecMundo...");
    
    const urlFeed = "https://rss.tecmundo.com.br/feed";
    
    try {
        // Faz a requisição para obter o XML do feed do TecMundo
        const respostaFeed = await fetch(urlFeed);
        if (!respostaFeed.ok) throw new Error(`Erro ao aceder ao RSS: ${respostaFeed.status}`);
        
        const xmlTexto = await respostaFeed.text();
        
        // Extrai o primeiro <item> (a notícia mais recente) usando Expressão Regular (Regex)
        const itemRegex = /<item>([\s\S]*?)<\/item>/;
        const matchItem = xmlTexto.match(itemRegex);
        
        if (!matchItem) {
            console.log("❌ Nenhuma estrutura <item> encontrada no RSS.");
            return;
        }
        
        const itemConteudo = matchItem[1];
        
        // Captura as tags e limpa possíveis blocos CDATA que o TecMundo envia
        const tituloMatch = itemConteudo.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemConteudo.match(/<title>([\s\S]*?)<\/title>/);
        const conteudoMatch = itemConteudo.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemConteudo.match(/<description>([\s\S]*?)<\/description>/);
        
        // 🌟 NOVA CAPTURA JS: Procura a tag <link> original da notícia
        const linkMatch = itemConteudo.match(/<link>([\s\S]*?)<\/link>/);
        
        const titulo = tituloMatch ? tituloMatch[1].trim() : "Sem título";
        const conteudo = conteudoMatch ? conteudoMatch[1].trim() : "";
        const link_noticia = linkMatch ? linkMatch[1].trim() : "https://www.tecmundo.com.br";
        
        console.log(`✅ Notícia capturada com sucesso: "${titulo}"`);
        
        // Preparação do envio para a API Rest do teu Supabase Cloud
        console.log("🚀 Preparando a injeção de dados no Supabase Cloud...");
        const urlApi = `${SUPABASE_URL}/rest/v1/noticias`;
        
        // 🌟 PAYLOAD ATUALIZADO: Enviamos a nova coluna link_noticia para o banco
        const dados = {
            titulo: titulo,
            conteudo: conteudo,
            link_noticia: link_noticia
        };
        
        const respostaSupabase = await fetch(urlApi, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify(dados)
        });
        
        if (respostaSupabase.status === 200 || respostaSupabase.status === 201) {
            console.log("🔥 SUCESSO ABSOLUTO: Notícia e Link guardados na nuvem do Supabase!");
        } else {
            const erroDetalhes = await respostaSupabase.text();
            console.log(`❌ Erro ao salvar no Supabase. Status: ${respostaSupabase.status}`);
            console.log(`Detalhes: ${erroDetalhes}`);
        }
        
    } catch (erro) {
        console.error("❌ Falha crítica no motor de automação:", erro);
    }
}

// Dispara a execução do script
executarAutomacao();