import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../public/vendor/three.module.js';
import { pavilionRoof } from '../public/roof-geometry.js';
import { campusLayout, auditoriumGroundHeight, isCampusWalkway } from '../public/campus-layout.js';

test('canteen roof has a rectangular footprint centred over all four supports', () => {
  const roof = pavilionRoof(20, 14, new THREE.MeshStandardMaterial());
  roof.position.x = campusLayout.canteen.x;
  roof.position.z = campusLayout.canteen.z;
  roof.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(roof),
    centre = bounds.getCenter(new THREE.Vector3());
  assert.equal(centre.x, 68);
  assert.equal(centre.z, 47);
  assert.equal(bounds.max.x - bounds.min.x, 20);
  assert.equal(bounds.max.z - bounds.min.z, 14);
  assert.equal(roof.rotation.y, 0);
  assert.equal(roof.scale.x, 1);
  assert.equal(roof.scale.z, 1);
  for (const x of [-8.5, 8.5])
    for (const z of [-5.5, 5.5]) {
      const hit = new THREE.Raycaster(
        new THREE.Vector3(68 + x, 10, 47 + z),
        new THREE.Vector3(0, -1, 0),
      ).intersectObject(roof)[0];
      assert(hit, 'every supporting column has roof overhead');
      assert(
        hit.point.y > 5.1 && hit.point.y <= 5.25,
        'columns meet the roof instead of floating beside it',
      );
    }
});

test('the attached venue advances together and its entrances remain reachable by stairs and paths', () => {
  const hall = campusLayout.auditorium,
    library = campusLayout.library;
  assert.equal(hall.z, 49);
  assert.equal(library.z, hall.z);
  assert.equal(library.x - hall.x, 24);
  assert.equal(hall.doorZ, 37 + hall.dz);
  assert.equal(library.doorZ, 42.2 + library.dz);
  assert.equal(auditoriumGroundHeight(hall.doorX, hall.doorZ), 2.1);
  let previous = 0;
  for (let z = 31.5; z < 37.5; z += 0.1) {
    const height = auditoriumGroundHeight(hall.x, z);
    assert(height >= previous);
    assert(height <= 2.1);
    previous = height;
  }
  assert.equal(
    auditoriumGroundHeight(hall.x, 30),
    null,
    'the previous approach stays at ground level',
  );
  assert(isCampusWalkway(library.doorX, library.doorZ));
  assert.equal(
    auditoriumGroundHeight(hall.x - 17.5, hall.dz + 48.7),
    0,
    'rear steps still descend toward the prayer path',
  );
});
