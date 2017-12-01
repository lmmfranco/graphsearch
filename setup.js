"use strict";
const _ = require('lodash');
const util = require('util');
const fs = require('fs');
const googleMaps = require('@google/maps');

const escreverArquivo = util.promisify(fs.writeFile);

const googleMapsClient = googleMaps.createClient({
    key: 'AIzaSyDgMd02kISAZOkuPA7lUh6ZuGCVNxWMvZ8'
});

const estados = [
    {
        uf: 'AC',
        estado: 'Acre',
        capital: 'Rio Branco',
        adjacencias: ['AM', 'RO']
    },
    {
        uf: 'AL',
        estado: 'Alagoas',
        capital: 'Maceió',
        adjacencias: ['SE', 'BA', 'PE']
    },
    {
        uf: 'AP',
        estado: 'Amapá',
        capital: 'Macapá',
        adjacencias: ['PA']
    },
    {
        uf: 'AM',
        estado: 'Amazonas',
        capital: 'Manaus',
        adjacencias: ['RR', 'PA', 'MT', 'RO', 'AC']
    },
    {
        uf: 'BA',
        estado: 'Bahia',
        capital: 'Salvador',
        adjacencias: ['SE', 'AL', 'PE', 'PI', 'TO', 'GO', 'MG', 'ES']
    },
    {
        uf: 'CE',
        estado: 'Ceará',
        capital: 'Fortaleza',
        adjacencias: ['RN', 'PB', 'PE', 'PI']
    },
    {
        uf: 'DF',
        estado: 'Distrito Federal',
        capital: 'Brasília',
        adjacencias: ['GO']
    },
    {
        uf: 'ES',
        estado: 'Espírito Santo',
        capital: 'Vitória',
        adjacencias: ['BA', 'MG', 'RJ']
    },
    {
        uf: 'GO',
        estado: 'Goiás',
        capital: 'Goiânia',
        adjacencias: ['TO', 'BA', 'MG', 'MS', 'MT', "DF"]
    },
    {
        uf: 'MA',
        estado: 'Maranhão',
        capital: 'São Luís',
        adjacencias: ['PA', 'TO', 'PI']
    },
    {
        uf: 'MT',
        estado: 'Mato Grosso',
        capital: 'Cuiabá',
        adjacencias: ['RO', 'AM', 'PA', 'GO', 'MS']
    },
    {
        uf: 'MS',
        estado: 'Mato Grosso do Sul',
        capital: 'Campo Grande',
        adjacencias: ['MT', 'GO', 'MG', 'SP', 'PR']
    },
    {
        uf: 'MG',
        estado: 'Minas Gerais',
        capital: 'Belo Horizonte',
        adjacencias: ['GO', 'BA', 'ES', 'RJ', 'SP', 'MS']
    },
    {
        uf: 'PA',
        estado: 'Pará',
        capital: 'Belém',
        adjacencias: ['AM', 'RR', 'AP', 'MA', 'TO', 'MT']
    },
    {
        uf: 'PB',
        estado: 'Paraíba',
        capital: 'João Pessoa',
        adjacencias: ['RN', 'CE', 'PE']
    },
    {
        uf: 'PR',
        estado: 'Paraná',
        capital: 'Curitiba',
        adjacencias: ['MS', 'SP', 'SC']
    },
    {
        uf: 'PE',
        estado: 'Pernambuco',
        capital: 'Recife',
        adjacencias: ['PI', 'CE', 'PB', 'AL', 'BA']
    },
    {
        uf: 'PI',
        estado: 'Piauí',
        capital: 'Teresina',
        adjacencias: ['MA', 'CE', 'PE', 'BA', 'TO']
    },
    {
        uf: 'RJ',
        estado: 'Rio de Janeiro',
        capital: 'Rio de Janeiro',
        adjacencias: ['SP', 'MG', 'ES']
    },
    {
        uf: 'RN',
        estado: 'Rio Grande do Norte',
        capital: 'Natal',
        adjacencias: ['CE', 'PB']
    },
    {
        uf: 'RS',
        estado: 'Rio Grande do Sul',
        capital: 'Porto Alegre',
        adjacencias: ['SC']
    },
    {
        uf: 'RO',
        estado: 'Rondônia',
        capital: 'Porto Velho',
        adjacencias: ['AC', 'AM', 'MT']
    },
    {
        uf: 'RR',
        estado: 'Roraima',
        capital: 'Boa Vista',
        adjacencias: ['AM', 'PA']
    },
    {
        uf: 'SC',
        estado: 'Santa Catarina',
        capital: 'Florianópolis',
        adjacencias: ['RS', 'PR']
    },
    {
        uf: 'SP',
        estado: 'São Paulo',
        capital: 'São Paulo',
        adjacencias: ['MS', 'MG', 'RJ', 'PR']
    },
    {
        uf: 'SE',
        estado: 'Sergipe',
        capital: 'Aracaju',
        adjacencias: ['BA', 'AL']
    },
    {
        uf: 'TO',
        estado: 'Tocantins',
        capital: 'Palmas',
        adjacencias: ['PA', 'MA', 'PI', 'BA', 'GO', 'MT']
    }
];

let rotas = [];

async function detalhesLocal(endereco) {
    return new Promise((resolve, reject) => {
        googleMapsClient.geocode({ address: endereco }, (err, response) => {
            if (err) return reject(err);
            else return resolve(response.json);
        });
    });
}

async function pesquisarRotas(origem, destino) {
    return new Promise((resolve, reject) => {
        googleMapsClient.directions({ origin: origem, destination: destino }, (err, response) => {
            if (err) return reject(err);
            else return resolve(response.json);
        });
    });
}

function verificaRotaDuplicada(ufs) {
    for (let r of rotas) {
        if (_.isEqual(r.ufs.sort(), ufs.sort())) {
            return true;
        }
    };
    return false;
}

async function init() {
    try {
        // Adquire coordenadas de todas as capitais
        for (let estado of estados) {
            console.log(`Obtendo dados de ${estado.capital} - ${estado.uf}...`)
            let response = await detalhesLocal(`${estado.capital} ${estado.uf}`);
            estado.posicao = response.results[0].geometry.location;
        }

        // Constroi arestas de acordo com as adjacencias
        console.log("Construindo arestas...")
        for (let estado of estados) {
            for (let ufAjacente of estado.adjacencias) {
                let adj = _.find(estados, { uf: ufAjacente });

                let rota = {
                    ufs: [estado.uf, adj.uf],
                    inicio: estado.posicao,
                    fim: adj.posicao
                }

                if (!verificaRotaDuplicada(rota.ufs)) {
                    rotas.push(rota);
                }
            }
        }

        // Obtem distancia percorrida nas rotas (m)
        for (let rota of rotas) {
            console.log(`Obtendo percurso entre ${rota.ufs[0]} e ${rota.ufs[1]}...`)
            let resposta = await pesquisarRotas(rota.inicio, rota.fim);

            if(resposta.routes.length) {
                rota.distancia = resposta.routes[0].legs[0].distance.value;
            } else {
                rota.distancia = null;
            }
        }

        // Agrega as as informações obtidas
        let dados = {
            vertices: estados,
            arestas: rotas
        };

        // Armazena as informações obtidas
        console.log("Armazenando dados em 'grafos_brasil.json'...")
        escreverArquivo('grafo_brasil.json', JSON.stringify(dados), 'utf8');
        console.log("Feito.")
    } catch (error) {
        console.error(error);
    }

}

init();
