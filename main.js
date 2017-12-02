const ESTRATEGIA_DFS = 0; 
const ESTRATEGIA_BFS = 1;
const INTERVALO_ANIM = 100;

const ICONE_PADRAO = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 15,
    fillColor: 'white',
    fillOpacity: 1,
    strokeColor: 'black',
    strokeWeight: 3
};

const CORES = [
    "#75ceff",
    "#75ffc3",
    "#b075ff",
    "#caff75",
    "#ff8275",
    "#ff75ba"
]

var map;
var grafo;
var timer = 100;

function init() {
    
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 5,
      center: {lat: -12.958838027361784, lng: -50.48753859999999}
    });

    axios.get('grafo_brasil.json').then(function (response) {
        grafo = response.data;

        for(var vertice of grafo.vertices) {
            vertice.marcador = plotarVertice(vertice);
        }

        for(var aresta of grafo.arestas) {
            aresta.polyline = plotarAresta(aresta.inicio, aresta.fim);
        }

    }).catch(function (error) {
        console.log(error);
    });
}

function plotarVertice(vertice) {
    var marker = new google.maps.Marker({
      map: map,
      position: vertice.posicao,
      title: vertice.capital,
      label: vertice.uf,
      icon: ICONE_PADRAO,
    });

    google.maps.event.addListener(marker, "mouseover", function(evt) {
        if(marker.icon.strokeColor != "blue") {
            marker.icon.strokeColor = "blue";
            marker.setIcon(marker.icon);
        }
    });

    google.maps.event.addListener(marker, "mouseout", function(evt) {
        if(marker.icon.strokeColor != "black") {
            marker.icon.strokeColor = "black";
            marker.setIcon(marker.icon);
        }
    });

    google.maps.event.addListener(marker, 'click', function() {
        let estrategia = document.querySelector('input[name="estrategia"]:checked').value;
        resetGrafo();

        if(estrategia == ESTRATEGIA_DFS) {
            dfs(grafo.vertices, getVerticePorUF(marker.label));
        } else if(estrategia == ESTRATEGIA_BFS) {
            bfs(grafo.vertices, getVerticePorUF(marker.label));
        }
    });

    return marker;
}

function plotarAresta(inicio, fim) {
    var polyline = new google.maps.Polyline({
        map: map,
        path: [inicio, fim],
        geodesic: true,
        strokeColor: 'black',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });

    return polyline;
}

function getVerticePorUF(uf) {
    return _.find(grafo.vertices, { uf: uf })
}

function getArestaEntreVerticeUf(vertice, uf) {
    return _.find(grafo.arestas, { ufs: [vertice.uf, uf].sort() });
}

function resetGrafo() {
    timer = INTERVALO_ANIM;
    grafo.vertices.forEach(function(v) {
        v.marcado = false;
        v.marcador.setIcon(ICONE_PADRAO);
        delete v.cor;
    });
}

function podePintarVertice(vertice, cor) {
    for(const uf of vertice.adjacencias) {
        let v = getVerticePorUF(uf);
        if(v.cor == cor) {
            return false;
        }
    }
    return true;
}

function pintaVertice(vertice) {
    vertice.cor = 0;

    while(!podePintarVertice(vertice, vertice.cor)) {
        vertice.cor++;
    }

    setTimeout(function() {
        vertice.marcador.icon.fillColor = CORES[vertice.cor];
        vertice.marcador.setIcon(_.clone(vertice.marcador.icon));
    }, timer)

    timer += INTERVALO_ANIM;
}

function pintaAresta(aresta) {
    if(aresta) {
        setTimeout(function() {
            aresta.polyline.setOptions({strokeColor: "red"});
        }, timer - INTERVALO_ANIM);
    
        setTimeout(function() {
            aresta.polyline.setOptions({strokeColor: "black"});
        }, timer);
    }
}

function pesquisaProfundidade(raiz) {
    const pilha = [];
    const pilhaArestas = [];

    pilha.push(raiz);

    while (pilha.length > 0) {
        const vertice = pilha.pop();
        const aresta = pilhaArestas.pop();

        if (!vertice.marcado) {
            vertice.marcado = true;
            pintaAresta(aresta)
            pintaVertice(vertice);

            vertice.adjacencias.forEach(uf => {
                pilha.push(getVerticePorUF(uf));
                pilhaArestas.push(getArestaEntreVerticeUf(vertice, uf));
            });
        }
    }
}

function dfs(grafo, raiz) {
    if (raiz) {
        pesquisaProfundidade(raiz);
    }

    grafo.forEach(vertice => {
        if (!vertice.marcado) {
            pesquisaProfundidade(vertice);
        }
    });

}

function pesquisaLargura(raiz) {
    const fila = [];
    const filaArestas = [];

    fila.push(raiz);

    while (fila.length > 0) {
        const vertice = fila.shift();
        const aresta = filaArestas.shift();
        
        if (!vertice.marcado) {
            vertice.marcado = true;
            pintaAresta(aresta)
            pintaVertice(vertice);
            
            vertice.adjacencias.forEach(uf => {
                fila.push(getVerticePorUF(uf));
                filaArestas.push(getArestaEntreVerticeUf(vertice, uf));
            });
        }
    }
}

function bfs(grafo, raiz) {

    if (raiz) {
        pesquisaLargura(raiz);
    }

    grafo.forEach(vertice => {
        if (!vertice.marcado) {
            pesquisaLargura(vertice);
        }
    });

}

init();