// ============================================
// Three.js 인트로 애니메이션
// ============================================

(function() {
  'use strict';

  function hilbert3D(center, size, iterations, v0, v1, v2, v3, v4, v5, v6, v7) {
    var half = size / 2;
    var vec_s = [
      new THREE.Vector3(center.x - half, center.y + half, center.z - half),
      new THREE.Vector3(center.x - half, center.y + half, center.z + half),
      new THREE.Vector3(center.x - half, center.y - half, center.z + half),
      new THREE.Vector3(center.x - half, center.y - half, center.z - half),
      new THREE.Vector3(center.x + half, center.y - half, center.z - half),
      new THREE.Vector3(center.x + half, center.y - half, center.z + half),
      new THREE.Vector3(center.x + half, center.y + half, center.z + half),
      new THREE.Vector3(center.x + half, center.y + half, center.z - half)
    ];
    var vec = [vec_s[v0], vec_s[v1], vec_s[v2], vec_s[v3], vec_s[v4], vec_s[v5], vec_s[v6], vec_s[v7]];
    if (--iterations >= 0) {
      var tmp = [];
      Array.prototype.push.apply(tmp, hilbert3D(vec[0], half, iterations, v0, v3, v4, v7, v6, v5, v2, v1));
      Array.prototype.push.apply(tmp, hilbert3D(vec[1], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3));
      Array.prototype.push.apply(tmp, hilbert3D(vec[2], half, iterations, v0, v7, v6, v1, v2, v5, v4, v3));
      Array.prototype.push.apply(tmp, hilbert3D(vec[3], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5));
      Array.prototype.push.apply(tmp, hilbert3D(vec[4], half, iterations, v2, v3, v0, v1, v6, v7, v4, v5));
      Array.prototype.push.apply(tmp, hilbert3D(vec[5], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7));
      Array.prototype.push.apply(tmp, hilbert3D(vec[6], half, iterations, v4, v3, v2, v5, v6, v1, v0, v7));
      Array.prototype.push.apply(tmp, hilbert3D(vec[7], half, iterations, v6, v5, v2, v1, v0, 3, 4, v7));
      return tmp;
    }
    return vec;
  }

  var scene, camera, renderer, lines = [];
  var mouseX = 0, mouseY = 0;
  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2;

  window.initThreeJS = function() {
    var canvas = document.getElementById('three-canvas');
    camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1000;
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    var hilbertPoints = hilbert3D(new THREE.Vector3(0, 0, 0), 200.0, 1, 0, 1, 2, 3, 4, 5, 6, 7);
    var geometry1 = new THREE.BufferGeometry();
    var geometry2 = new THREE.BufferGeometry();
    var geometry3 = new THREE.BufferGeometry();
    var subdivisions = 6;
    var vertices = [], colors1 = [], colors2 = [], colors3 = [];
    var point = new THREE.Vector3();
    var color = new THREE.Color();
    var spline = new THREE.CatmullRomCurve3(hilbertPoints);

    for (var i = 0; i < hilbertPoints.length * subdivisions; i++) {
      var t = i / (hilbertPoints.length * subdivisions);
      spline.getPoint(t, point);
      vertices.push(point.x, point.y, point.z);
      color.setHSL(0.08, 0.9, Math.max(0, -point.x / 200) + 0.5);
      colors1.push(color.r, color.g, color.b);
      color.setHSL(0.12, 0.95, Math.max(0, -point.y / 200) + 0.5);
      colors2.push(color.r, color.g, color.b);
      color.setHSL(i / (hilbertPoints.length * subdivisions) * 0.1, 0.9, 0.6);
      colors3.push(color.r, color.g, color.b);
    }

    geometry1.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry3.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors1, 3));
    geometry2.setAttribute('color', new THREE.Float32BufferAttribute(colors2, 3));
    geometry3.setAttribute('color', new THREE.Float32BufferAttribute(colors3, 3));

    var material = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 });
    var scale = 0.35, d = 250;
    var parameters = [
      [material, scale * 1.5, [-d, 0, 0], geometry1],
      [material, scale * 1.5, [0, 0, 0], geometry2],
      [material, scale * 1.5, [d, 0, 0], geometry3]
    ];

    for (var i = 0; i < parameters.length; i++) {
      var p = parameters[i];
      var line = new THREE.Line(p[3], p[0]);
      line.scale.x = line.scale.y = line.scale.z = p[1];
      line.position.x = p[2][0]; line.position.y = p[2][1]; line.position.z = p[2][2];
      scene.add(line);
      lines.push(line);
    }

    document.addEventListener('mousemove', function(e) { mouseX = e.clientX - windowHalfX; mouseY = e.clientY - windowHalfY; });
    window.addEventListener('resize', function() {
      windowHalfX = window.innerWidth / 2; windowHalfY = window.innerHeight / 2;
      if (camera && renderer) { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
    });

    (function animate() {
      requestAnimationFrame(animate);
      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.3 + 200 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      var time = Date.now() * 0.0003;
      for (var i = 0; i < lines.length; i++) lines[i].rotation.y = time * (i % 2 ? 1 : -1);
      renderer.render(scene, camera);
    })();
  };
})();
