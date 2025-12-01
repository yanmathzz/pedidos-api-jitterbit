// ====================================================
// API DE GERENCIAMENTO DE PEDIDOS - JITTERBIT TEST
// ====================================================
// Autor: Yan Matheus Pinheiro
// Data: 30/11/2025
// Descrição: API RESTful para CRUD de pedidos com SQLite
// ====================================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Middleware para processar JSON
app.use(express.json());

// ====================================================
// CONEXÃO COM BANCO DE DADOS SQLite
// ====================================================
const db = new sqlite3.Database('./pedidos.db', (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado ao banco de dados SQLite');
    inicializarBanco();
});

// ====================================================
// INICIALIZAÇÃO DO BANCO DE DADOS
// ====================================================
function inicializarBanco() {
    // Tabela de pedidos (Orders)
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT UNIQUE NOT NULL,
        value REAL NOT NULL,
        creationDate TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Erro ao criar tabela orders:', err.message);
        else console.log('✅ Tabela "orders" verificada/criada');
    });

    // Tabela de itens (Items)
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId TEXT NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(orderId) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Erro ao criar tabela items:', err.message);
        else console.log('✅ Tabela "items" verificada/criada');
    });
}

// ====================================================
// FUNÇÃO DE TRANSFORMAÇÃO (MAPPING) DE DADOS
// ====================================================
/**
 * Transforma os dados recebidos da API para o formato do banco de dados
 * @param {Object} dadosEntrada - Dados no formato da requisição
 * @returns {Object} Dados transformados para o banco
 */
function transformarDados(dadosEntrada) {
    try {
        // Extrair orderId removendo o sufixo (ex: "v10089015vdb-01" -> "v10089015vdb")
        const orderId = dadosEntrada.numeroPedido.split('-')[0];
        
        // Converter data para formato ISO
        const creationDate = new Date(dadosEntrada.dataCriacao).toISOString();
        
        // Transformar array de itens
        const items = dadosEntrada.items.map(item => ({
            productId: parseInt(item.idItem),
            quantity: item.quantidadeItem,
            price: item.valorItem
        }));

        return {
            orderId,
            value: dadosEntrada.valorTotal,
            creationDate,
            items
        };
    } catch (error) {
        throw new Error(`Erro na transformação de dados: ${error.message}`);
    }
}

// ====================================================
// ENDPOINTS DA API
// ====================================================

// ----------------------------------------------------
// 1. CRIAR UM NOVO PEDIDO (POST /order) 
// ----------------------------------------------------
app.post('/order', (req, res) => {
    console.log('📝 Requisição POST /order recebida');
    
    try {
        // Validação dos dados de entrada
        const { numeroPedido, valorTotal, dataCriacao, items } = req.body;
        
        if (!numeroPedido || !valorTotal || !dataCriacao || !items) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios ausentes',
                required: ['numeroPedido', 'valorTotal', 'dataCriacao', 'items']
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'O campo "items" deve ser um array com pelo menos um item'
            });
        }

        // Transformar dados
        const dadosTransformados = transformarDados(req.body);
        console.log('🔄 Dados transformados:', dadosTransformados);

        // Inserir no banco de dados (transação)
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Inserir na tabela orders
            db.run(
                `INSERT INTO orders (orderId, value, creationDate) VALUES (?, ?, ?)`,
                [dadosTransformados.orderId, dadosTransformados.value, dadosTransformados.creationDate],
                function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        if (err.code === 'SQLITE_CONSTRAINT') {
                            return res.status(409).json({
                                success: false,
                                error: `Pedido com ID ${dadosTransformados.orderId} já existe`
                            });
                        }
                        throw err;
                    }

                    const orderDbId = this.lastID;

                    // Inserir itens na tabela items
                    const insertItem = db.prepare(
                        `INSERT INTO items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`
                    );

                    dadosTransformados.items.forEach(item => {
                        insertItem.run([
                            dadosTransformados.orderId,
                            item.productId,
                            item.quantity,
                            item.price
                        ], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                throw err;
                            }
                        });
                    });

                    insertItem.finalize();

                    db.run('COMMIT', (err) => {
                        if (err) throw err;
                        
                        console.log(`✅ Pedido ${dadosTransformados.orderId} criado com sucesso`);
                        res.status(201).json({
                            success: true,
                            message: 'Pedido criado com sucesso',
                            data: {
                                ...dadosTransformados,
                                id: orderDbId
                            }
                        });
                    });
                }
            );
        });

    } catch (error) {
        console.error('❌ Erro ao processar requisição:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ------------------------------------------------------------
// 2. OBTER DADOS DO PEDIDO POR ID (GET /order/:orderId) 
// ------------------------------------------------------------
app.get('/order/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log(`🔍 Buscando pedido: ${orderId}`);

    // Buscar pedido principal
    db.get(
        `SELECT orderId, value, creationDate FROM orders WHERE orderId = ?`,
        [orderId],
        (err, order) => {
            if (err) {
                console.error('Erro ao buscar pedido:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Erro interno ao buscar pedido'
                });
            }

            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: `Pedido com ID ${orderId} não encontrado`
                });
            }

            // Buscar itens do pedido
            db.all(
                `SELECT productId, quantity, price FROM items WHERE orderId = ?`,
                [orderId],
                (err, items) => {
                    if (err) {
                        console.error('Erro ao buscar itens:', err.message);
                        return res.status(500).json({
                            success: false,
                            error: 'Erro interno ao buscar itens'
                        });
                    }

                    const resposta = {
                        orderId: order.orderId,
                        value: order.value,
                        creationDate: order.creationDate,
                        items: items
                    };

                    res.status(200).json({
                        success: true,
                        data: resposta
                    });
                }
            );
        }
    );
});

// ----------------------------------------------------
// 3. LISTAR TODOS OS PEDIDOS (GET /order/list) 
// ----------------------------------------------------
app.get('/order/list', (req, res) => {
    console.log('📋 Listando todos os pedidos');
    
    // Buscar todos os pedidos com seus itens
    db.all(
        `SELECT o.orderId, o.value, o.creationDate,
                GROUP_CONCAT(i.productId || '|' || i.quantity || '|' || i.price) as itemsData
         FROM orders o
         LEFT JOIN items i ON o.orderId = i.orderId
         GROUP BY o.orderId
         ORDER BY o.createdAt DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Erro ao listar pedidos:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Erro interno ao listar pedidos'
                });
            }

            const pedidos = rows.map(row => {
                const items = row.itemsData ? row.itemsData.split(',').map(itemStr => {
                    const [productId, quantity, price] = itemStr.split('|');
                    return {
                        productId: parseInt(productId),
                        quantity: parseInt(quantity),
                        price: parseFloat(price)
                    };
                }) : [];

                return {
                    orderId: row.orderId,
                    value: row.value,
                    creationDate: row.creationDate,
                    items
                };
            });

            res.status(200).json({
                success: true,
                count: pedidos.length,
                data: pedidos
            });
        }
    );
});

// ------------------------------------------------------------
// 4. ATUALIZAR PEDIDO (PUT /order/:orderId) 
// ------------------------------------------------------------
app.put('/order/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log(`🔄 Atualizando pedido: ${orderId}`);

    try {
        // Validar dados de entrada
        const { numeroPedido, valorTotal, dataCriacao, items } = req.body;
        
        if (!numeroPedido || !valorTotal || !dataCriacao || !items) {
            return res.status(400).json({
                success: false,
                error: 'Todos os campos são obrigatórios para atualização'
            });
        }

        // Transformar dados
        const dadosAtualizados = transformarDados(req.body);

        // Verificar se o orderId da URL corresponde ao dos dados
        if (dadosAtualizados.orderId !== orderId) {
            return res.status(400).json({
                success: false,
                error: 'ID do pedido na URL não corresponde ao ID nos dados'
            });
        }

        // Atualizar no banco (transação)
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Verificar se pedido existe
            db.get(`SELECT id FROM orders WHERE orderId = ?`, [orderId], (err, row) => {
                if (err) {
                    db.run('ROLLBACK');
                    throw err;
                }

                if (!row) {
                    db.run('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        error: `Pedido com ID ${orderId} não encontrado`
                    });
                }

                // Atualizar pedido
                db.run(
                    `UPDATE orders SET value = ?, creationDate = ? WHERE orderId = ?`,
                    [dadosAtualizados.value, dadosAtualizados.creationDate, orderId],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            throw err;
                        }

                        // Remover itens antigos
                        db.run(`DELETE FROM items WHERE orderId = ?`, [orderId], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                throw err;
                            }

                            // Inserir novos itens
                            const insertItem = db.prepare(
                                `INSERT INTO items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`
                            );

                            dadosAtualizados.items.forEach(item => {
                                insertItem.run([
                                    orderId,
                                    item.productId,
                                    item.quantity,
                                    item.price
                                ], (err) => {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        throw err;
                                    }
                                });
                            });

                            insertItem.finalize();

                            db.run('COMMIT', (err) => {
                                if (err) throw err;
                                
                                console.log(`✅ Pedido ${orderId} atualizado com sucesso`);
                                res.status(200).json({
                                    success: true,
                                    message: 'Pedido atualizado com sucesso',
                                    data: dadosAtualizados
                                });
                            });
                        });
                    }
                );
            });
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar pedido:', error.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// ------------------------------------------------------------
// 5. DELETAR PEDIDO (DELETE /order/:orderId) 
// ------------------------------------------------------------
app.delete('/order/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    console.log(`🗑️  Deletando pedido: ${orderId}`);

    // Verificar se pedido existe
    db.get(`SELECT id FROM orders WHERE orderId = ?`, [orderId], (err, row) => {
        if (err) {
            console.error('Erro ao verificar pedido:', err.message);
            return res.status(500).json({
                success: false,
                error: 'Erro interno ao verificar pedido'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                error: `Pedido com ID ${orderId} não encontrado`
            });
        }

        // Deletar pedido (com CASCADE, os itens serão deletados automaticamente)
        db.run(`DELETE FROM orders WHERE orderId = ?`, [orderId], function(err) {
            if (err) {
                console.error('Erro ao deletar pedido:', err.message);
                return res.status(500).json({
                    success: false,
                    error: 'Erro interno ao deletar pedido'
                });
            }

            console.log(`✅ Pedido ${orderId} deletado com sucesso`);
            res.status(200).json({
                success: true,
                message: 'Pedido deletado com sucesso',
                orderId: orderId
            });
        });
    });
});

// ----------------------------------------------------
// 6. HEALTH CHECK 
// ----------------------------------------------------
app.get('/health', (req, res) => {
    db.get(`SELECT COUNT(*) as total FROM orders`, (err, row) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'API de Gerenciamento de Pedidos',
            database: 'SQLite',
            totalPedidos: row ? row.total : 0,
            endpoints: {
                create: 'POST /order',
                read: 'GET /order/:orderId',
                list: 'GET /order/list',
                update: 'PUT /order/:orderId',
                delete: 'DELETE /order/:orderId'
            }
        });
    });
});

// ----------------------------------------------------
// 7. ROTA DE FALLBACK 
// ----------------------------------------------------
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        availableEndpoints: [
            'POST   /order',
            'GET    /order/:orderId',
            'GET    /order/list',
            'PUT    /order/:orderId',
            'DELETE /order/:orderId',
            'GET    /health'
        ]
    });
});

// ====================================================
// INICIALIZAÇÃO DO SERVIDOR
// ====================================================
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 API DE GERENCIAMENTO DE PEDIDOS - JITTERBIT');
    console.log('='.repeat(60));
    console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`🗄️  Banco de dados: SQLite (pedidos.db)`);
    console.log('='.repeat(60));
    console.log('✅ ENDPOINTS DISPONÍVEIS:');
    console.log('='.repeat(60));
    console.log('📝 POST   /order           - Criar novo pedido');
    console.log('👁️  GET    /order/:orderId  - Buscar pedido por ID');
    console.log('📋 GET    /order/list      - Listar todos pedidos');
    console.log('✏️  PUT    /order/:orderId  - Atualizar pedido');
    console.log('🗑️  DELETE /order/:orderId  - Deletar pedido');
    console.log('❤️  GET    /health          - Verificar saúde da API');
    console.log('='.repeat(60));
    console.log('✅ PRONTO PARA RECEBER REQUISIÇÕES!');
    console.log('='.repeat(60));
});

// Exportar app para testes
module.exports = app;