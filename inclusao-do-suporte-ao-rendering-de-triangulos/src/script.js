///////////////////////////////////////////////////////////////////////////////
// Funcao que desenha um pixel colorido no canvas.
// Entrada: 
//   x, y: Coordenadas de tela do pixel.
//   color: Cor do pixel no formato RGB (THREE.Vector3).
// Retorno:
//   Sem retorno.
///////////////////////////////////////////////////////////////////////////////
function PutPixel(x, y, color) {
  let c = document.getElementById("canvas");
  let ctx = c.getContext("2d");
  let r = Math.min(255, Math.max(0, Math.round(color.x * 255)));
  let g = Math.min(255, Math.max(0, Math.round(color.y * 255)));
  let b = Math.min(255, Math.max(0, Math.round(color.z * 255)));
  ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
  ctx.fillRect(x, y, 1, 2);
}

///////////////////////////////////////////////////////////////////////////////
// Classe que representa um raio de luz.
// Construtor: 
//   origem: Ponto de origem do raio (THREE.Vector3).
//   direcao: Vetor unitario que indica a direcao do raio (THREE.Vector3).
///////////////////////////////////////////////////////////////////////////////
class Raio {
  constructor(origem, direcao) {
    this.origem = origem;
    this.direcao = direcao;
  }
}

///////////////////////////////////////////////////////////////////////////////
// Classe que representa a camera.
// Construtor: 
//   Sem parametros. Os atributos da camera estao 'hard coded' no construtor.
///////////////////////////////////////////////////////////////////////////////
class Camera {
  constructor() {
    this.resolucaoX = 512; // Resolucao do sensor em X.
    this.resolucaoY = 512; // Resolucao do sensor em Y.
    this.d = 1.0;          // Distancia do sensor em relacao a posicao da camera.
    this.xMin = -1.0;      // Extremidade esquerda do sensor.
    this.xMax =  1.0;      // Extremidade direita do sensor.
    this.yMin = -1.0;      // Extremidade inferior do sensor.
    this.yMax =  1.0;      // Extremidade superior do sensor.
    this.k = new THREE.Vector3(this.xMin, this.yMax, -this.d);   // Canto superior esquerdo do sensor.
    this.a = new THREE.Vector3(this.xMax - this.xMin, 0.0, 0.0); // Vetor para calculo de um ponto sobre o sensor.
    this.b = new THREE.Vector3(0.0, this.yMin - this.yMax, 0.0); // Vetor para calculo de um ponto sobre o sensor.
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Metodo que converte coordenadas (x,y) de tela para um raio 
  // primario que passa pelo centro do pixel no espaco do universo.
  // Entrada: 
  //   x, y: Coordenadas de tela do pixel.
  // Retorno:
  //   Um objeto do tipo Raio.
  ///////////////////////////////////////////////////////////////////////////////
  raio(x, y) {
    let u = (x + 0.5) / this.resolucaoX;
    let v = (y - 0.5) / this.resolucaoY;
    let p = ((this.a.clone().multiplyScalar(u)).add(this.b.clone().multiplyScalar(v))).add(this.k);

    let origem = new THREE.Vector3(0.0,0.0,0.0);
    let direcao = p.normalize();

    return new Raio(origem, direcao);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Classe que representa um ponto de interseccao entre o raio e uma primitiva.
// Construtor: 
//   Sem parametros. As propriedades de um objeto desta classe sao preenchidas
//   assim que uma interseccao raio-primitiva e detectada.
///////////////////////////////////////////////////////////////////////////////
class Interseccao {
  constructor() {
    this.t = Infinity; // distancia entre a origem do rio e o ponto de intersecao.
    this.posicao = new THREE.Vector3(0.0, 0.0, 0.0); // Coordenadas do ponto de interseccao.
    this.normal = new THREE.Vector3(0.0, 0.0, 0.0);  // Vetor normal no ponto de interseccao.
  }
}

///////////////////////////////////////////////////////////////////////////////
// Classe que representa uma primitiva do tipo esfera.
// Construtor: 
//   centro: Coordenadas do centro da esfera no espaco do universo (THREE.Vector3).
//   raio: Raio da esfera.
///////////////////////////////////////////////////////////////////////////////
class Triangulo {
  constructor(v1, v2, v3) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Metodo que testa a interseccao entre o raio e o triângulo
  // Entrada: 
  //   raio: Objeto do tipo Raio cuja a interseccao com o triângulo se quer verificar.
  //   interseccao: Objeto do tipo Interseccao que armazena os dados da interseccao caso esta ocorra.
  // Retorno:
  //   Um valor booleano: 'true' caso haja interseccao; ou 'false' caso contrario.
  ///////////////////////////////////////////////////////////////////////////////
    interseccionar(raio, interseccao) {
    let v1 = this.v1;
    let v2 = this.v2;
    let v3 = this.v3;
      
    let v1v2 = v2.clone().sub(v1);
    let v3v1 = v3.clone().sub(v1);
    
    let invDet = 1.0 / v1v2.clone().dot(raio.direcao.clone().cross(v3v1));
    
    let tvec = raio.origem.clone().sub(v1);
    let qvec = tvec.clone().cross(v1v2);
      
    // Calcula os parâmentro "u" e "v"
    let u = tvec.clone().dot(raio.direcao.clone().cross(v3v1)) * invDet;
    let v = raio.direcao.clone().dot(qvec) * invDet;
       
    // Testa os resultado e "u" e "v"
    if (u < 0.0 || u > 1.0)
      return false;
      
    if (v < 0.0 || u + v > 1.0)
      return false;
    
    // Distancia entre o ponto P de interseccao e a origem do raio.
    interseccao.t = v3v1.clone().dot(qvec) * invDet;
    
    // Ponto P de interseccao.
    interseccao.posicao = v1.clone().multiplyScalar(1 - u - v).add(v2.clone().multiplyScalar(u)).add(v3.clone().multiplyScalar(v));
    
    // Ponto de interseccao do raio com o triangulo.
    interseccao.normal = v3.clone().sub(interseccao.posicao).cross(v2.clone().sub(interseccao.posicao)).normalize();

    return true;
  }
}

///////////////////////////////////////////////////////////////////////////////
// Classe que representa uma fonte de luz pontual.
// Construtor: 
//   posicao: Posicao da fonte de luz pontual no espaco (THREE.Vector3).
//   cor: Cor da fonte de luz no formato RGB (THREE.Vector3).
///////////////////////////////////////////////////////////////////////////////
class Luz {
  constructor(posicao, cor) {
    this.posicao = posicao;
    this.cor = cor;
  }
}

///////////////////////////////////////////////////////////////////////////////
// Funcao que renderiza a cena utilizando ray tracing.
// Entrada: 
//  Sem entradas.
// Retorno:
//   Sem retorno.
///////////////////////////////////////////////////////////////////////////////
function Render() {
  let camera = new Camera();
  let s1 = new Triangulo(new THREE.Vector3(-1.0, -1.0, -3.5), new THREE.Vector3(1.0, 1.0, -3.0), new THREE.Vector3(0.75, -1.0, -2.5));
  let Ip = new Luz(new THREE.Vector3(-10.0, 10.0, 4.0), new THREE.Vector3(0.8, 0.8, 0.8));

  // Lacos que percorrem os pixels do sensor.
  for (let y = 0; y < 512; ++y)
    for (let x = 0; x < 512; ++x) {

      let raio = camera.raio(x,y); // Construcao do raio primario que passa pelo centro do pixel de coordenadas (x,y).
      let interseccao = new Interseccao(); 

      if (s1.interseccionar(raio, interseccao)) { // Se houver interseccao entao...

        let ka = new THREE.Vector3(1.0, 0.0, 0.0);  // Coeficiente de reflectancia ambiente da esfera.
        let kd = new THREE.Vector3(1.0, 0.0, 0.0);  // Coeficiente de reflectancia difusa da esfera.
        let ks = new THREE.Vector3(1.0, 1.0, 1.0);  // Coeficiente de reflectancia especular da esfera.
        let Ia = new THREE.Vector3(0.2, 0.2, 0.2);  // Intensidade da luz ambiente. 

        let termo_ambiente = Ia.clone().multiply(ka); // Calculo do termo ambiente do modelo local de iluminacao.

        let L = (Ip.posicao.clone().sub(interseccao.posicao)).normalize(); // Vetor que aponta para a fonte e luz pontual.
        let R = L.clone().reflect(interseccao.normal); //Vetor que representa a reflexão de L sobre N. 
        let V = (interseccao.posicao).normalize(); // Vetor que aponta para a câmera

        // Calculo do termo difuso do modelo local de iluminacao.
        let termo_difuso = (Ip.cor.clone().multiply(kd)).multiplyScalar(Math.max(0.0, interseccao.normal.dot(L)));
        
        // Calculo do termo especular do modelo local de iluminacao.
        let termo_especular = (Ip.cor.clone().multiply(ks)).multiplyScalar(Math.max(0.0, R.dot(V))**32);

        // Combina os termos difuso, ambiente e especular e pinta o pixel.
        PutPixel(x, y, termo_difuso.add(termo_ambiente).add(termo_especular)); 
      } else // Senao houver interseccao entao...
        PutPixel(x, y, new THREE.Vector3(0.0, 0.0, 0.0)); // Pinta o pixel com a cor de fundo.
    }
}

Render(); // Invoca o ray tracer.