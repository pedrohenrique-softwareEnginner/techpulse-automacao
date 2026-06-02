// Importamos as bibliotecas necessárias
const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

// 1. Configurações de conexão
const SUPABASE_URL = "https://knjivcnrpnpjcvyeeztj.supabase.co"; 

// 🛡️ SECURITY BY DESIGN: A chave secreta nunca fica exposta no código cru.
// Ela é lida dinamicamente da memória segura do ambiente de execução (servidor ou nuvem).
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error("[❌ ERRO] A variável de ambiente SUPABASE_SERVICE_KEY não foi configurada.");
    process.exit(1);
}

// Inicializa o cliente do Supabase com privilégios de escrita (backend admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const parser = new Parser();

async function rodarRoboNoticias() {
    console.log("[ROBÔ] Iniciando varredura de notícias matinais...");

    try {
        // 2. Consome o RSS Feed Real do TecMundo (dados limpos e organizados)
        const feedUrl = "https://rss.tecmundo.com.br/feed";
        const feed = await parser.parseURL(feedUrl);

        if (!feed.items || feed.items.length === 0) {
            console.log("[❌ ERRO] Nenhum artigo encontrado no Feed RSS.");
            return;
        }

        // Pegamos a notícia mais recente (posição 0 do array)
        const ultimaNoticia = feed.items[0];

        // 3. Arrumar e estruturar o texto para ficar coerente com o nosso portal
        const tagFinal = "Destaque Tech";
        const tituloFinal = ultimaNoticia.title;
        
        // O RSS traz o texto com algumas tags HTML. Este regex limpa e pega apenas o início do texto
        let resumoLimpo = ultimaNoticia.contentSnippet || ultimaNoticia.content || "";
        resumoLimpo = resumoLimpo.replace(/<[^>]*>/g, '').substring(0, 200) + "...";

        // Cria o corpo expandido para o Modal dinâmico
        const conteudoCompletoFinal = `Artigo completo indexado via automação TechPulse. Original publicado em: ${ultimaNoticia.link}. Conteúdo expandido: ${ultimaNoticia.contentSnippet || 'Verifique o link original para ler a matéria na íntegra.'}`;

        console.log(`[ROBÔ] Nova notícia capturada: "${tituloFinal}"`);

        // 4. Injetar (INSERT) os dados diretamente na tabela do Supabase Cloud
        const { data, error } = await supabase
            .from('noticias')
            .insert([
                {
                    tag: tagFinal,
                    titulo: tituloFinal,
                    resumo: resumoLimpo,
                    conteudo_completo: conteudoCompletoFinal
                }
            ]);

        if (error) throw error;

        console.log("✅ [SUCESSO] O banco de dados foi atualizado com a notícia do dia!");

    } catch (error) {
        console.error("[❌ ERRO NA PIPELINE]:", error);
    }
}

// Executa o robô
rodarRoboNoticias();