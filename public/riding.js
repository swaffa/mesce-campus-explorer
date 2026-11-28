import { animateVehicleWheels } from './vehicle-wheels.js';
export function createRiding({ vehicles, player, social, toast, blocked, floor }) {
  const button = document.createElement('button');
  button.id = 'rideBtn';
  button.hidden = true;
  document.body.append(button);
  let mounted = null,
    busy = false,
    nearest = null,
    steering = 0,
    speed = 0;
  const vehicle = () => vehicles.find((v) => v.id === mounted);
  function seating(model, v) {
    const car = v?.kind === 'car';
    model.position.y = v
      ? v.group.position.y + (car ? 0.05 : 0.35)
      : floor(model.position.x, model.position.z);
    model.rotation.set(v?.group.rotation.x ?? 0, model.rotation.y, v?.group.rotation.z ?? 0, 'YXZ');
    model.scale.setScalar(car ? 0.72 : 1);
    model.userData.riding = !!v;
    model.userData.ridingOffset = car ? { x: -0.5, z: 0.2 } : null;
    model.userData.legs.forEach((l) => (l.rotation.x = v ? -1.2 : 0));
    model.userData.knees?.forEach((k) => (k.rotation.x = v ? 1 : 0));
    model.userData.arms.forEach((a) => (a.rotation.x = v ? -0.65 : 0));
  }
  async function toggle() {
    if (busy || !social.isJoined() || (!mounted && !nearest)) return;
    if (!mounted && !nearest.loaded) {
      if (nearest.error) nearest.load();
      return;
    }
    busy = true;
    try {
      const chosen = vehicle() || nearest,
        origin = chosen.group.position.clone(),
        heading = chosen.group.rotation.y;
      const id = mounted ? null : nearest.id;
      await social.requestRide(id);
      mounted = id;
      speed = steering = 0;
      if (id) {
        player.position.copy(origin);
        player.rotation.y = heading;
        if (document.body.classList.contains('phone-controls')) {
          toast('Slide the pad up to drive, down to reverse, and sideways to steer.');
        } else if (document.body.classList.contains('touch-controls')) {
          toast('Tap an open path to drive there.');
        } else {
          toast('W/S to drive or reverse · A/D to steer · R to get off');
        }
      } else {
        seating(player, null);
        chosen.parked = { x: origin.x, z: origin.z, yaw: heading };
        // Try both doors, then the ends if a wall or another car is alongside.
        for (const [dx, dz] of [
          [chosen.width / 2 + 1, 0],
          [-chosen.width / 2 - 1, 0],
          [0, chosen.length / 2 + 1],
          [0, -chosen.length / 2 - 1],
        ]) {
          const x = origin.x + dx * Math.cos(heading) + dz * Math.sin(heading);
          const z = origin.z - dx * Math.sin(heading) + dz * Math.cos(heading);
          if (!blocked(x, z)) {
            player.position.set(x, floor(x, z), z);
            break;
          }
        }
        toast('Back on foot. Your vehicle stays here.');
      }
    } catch (error) {
      toast(error.message);
    } finally {
      busy = false;
    }
  }
  button.onclick = toggle;
  addEventListener('keydown', (e) => {
    if (
      ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) ||
      document.querySelector('dialog[open]')
    )
      return;
    if (e.key.toLowerCase() === 'r' && !e.repeat) toggle();
  });
  function reconcile(players, id, positions = []) {
    for (const parked of positions) {
      const v = vehicles.find((v) => v.id === parked.vehicle);
      if (v) v.parked = { x: parked.x, z: parked.z, yaw: parked.yaw };
    }
    const next = players.find((p) => p.id === id)?.vehicle || null;
    if (busy) return;
    if (mounted && !next) {
      mounted = null;
      speed = 0;
      seating(player, null);
    }
    if (next && !mounted) mounted = next;
  }
  function drive(dt, keys, joy, path = []) {
    const v = vehicle();
    if (!v || busy) return;
    let forward = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) - joy.y;
    let turn = (keys.a || keys.arrowleft ? 1 : 0) - (keys.d || keys.arrowright ? 1 : 0) - joy.x;
    if (Math.abs(forward) + Math.abs(turn) > 0.1) path.length = 0;
    if (path.length) {
      let goal = path[0],
        distance = Math.hypot(goal.x - player.position.x, goal.z - player.position.z);
      if (distance < 1.2) {
        path.shift();
        goal = path[0];
      }
      if (goal) {
        const angle =
          Math.atan2(goal.x - player.position.x, goal.z - player.position.z) - player.rotation.y;
        const delta = Math.atan2(Math.sin(angle), Math.cos(angle));
        turn = Math.max(-1, Math.min(1, delta * 1.6));
        forward = Math.abs(delta) > 1.4 ? 0.3 : 1;
      } else {
        forward = 0;
        speed = 0;
      }
    }
    steering = turn;
    if (Math.abs(forward) > 0.08) speed += forward * (v.kind === 'car' ? 6.5 : 10) * dt;
    else speed *= Math.exp(-dt * 2.5);
    speed = Math.max(-3.5, Math.min(v.topSpeed, speed));
    player.rotation.y +=
      turn *
      Math.min(1, Math.abs(speed) / 3) *
      dt *
      (v.kind === 'car' ? 1.05 : 1.65) *
      (speed < 0 ? -1 : 1);
    const dx = Math.sin(player.rotation.y) * speed * dt,
      dz = Math.cos(player.rotation.y) * speed * dt;
    const x = player.position.x + dx,
      z = player.position.z + dz;
    let hit = blocked(x, z);
    if (!hit && v.kind === 'car')
      for (const side of [-1, 1])
        for (const end of [-1, 1]) {
          const lx = side * v.width * 0.43,
            lz = end * v.length * 0.41,
            c = Math.cos(player.rotation.y),
            s = Math.sin(player.rotation.y);
          if (blocked(x + lx * c + lz * s, z - lx * s + lz * c)) hit = true;
        }
    if (!hit) {
      player.position.x = x;
      player.position.z = z;
    } else {
      speed = 0;
      path.length = 0;
    }
  }
  function putDriver(v, driver, dt, local) {
    const yaw = driver.rotation.y;
    const dx = driver.position.x - v.group.position.x,
      dz = driver.position.z - v.group.position.z;
    const signed =
      Math.hypot(dx, dz) < Math.max(2, dt * v.topSpeed * 3)
        ? dx * Math.sin(yaw) + dz * Math.cos(yaw)
        : 0;
    const delta = yaw - v.group.rotation.y;
    const remoteSteer =
      Math.abs(signed) > 0.001
        ? Math.atan((v.length * 0.64 * Math.atan2(Math.sin(delta), Math.cos(delta))) / signed) / 0.5
        : 0;
    animateVehicleWheels(v, signed, local ? steering : remoteSteer, dt);
    v.place(driver.position.x, driver.position.z, yaw);
    seating(driver, v);
  }
  function update(started, dt = 1 / 60) {
    const occupied = new Set();
    for (const peer of social.getPeers().values()) {
      if (peer.vehicle) {
        const v = vehicles.find((v) => v.id === peer.vehicle);
        if (v) {
          occupied.add(v.id);
          putDriver(v, peer.model, dt, false);
        }
      } else if (peer.model.userData.riding) seating(peer.model, null);
    }
    if (mounted) {
      const v = vehicle();
      if (v) {
        occupied.add(v.id);
        putDriver(v, player, dt, true);
      }
    }
    nearest = null;
    let closest = 4.1;
    for (const v of vehicles)
      if (!occupied.has(v.id)) {
        animateVehicleWheels(v, 0, 0, dt);
        v.place(v.parked.x, v.parked.z, v.parked.yaw);
        const distance = Math.hypot(player.position.x - v.parked.x, player.position.z - v.parked.z);
        if (distance < closest) {
          closest = distance;
          nearest = v;
        }
      }
    button.hidden = !started || (!mounted && !nearest) || !!document.querySelector('dialog[open]');
    button.dataset.distance = mounted ? '0' : closest;
    button.textContent = mounted
      ? vehicle()?.kind === 'car'
        ? 'R · Get out of the car'
        : 'R · Get off your ride'
      : nearest
        ? nearest.loaded
          ? 'R · ' + (nearest.kind === 'car' ? 'Drive this car' : 'Ride this ' + nearest.kind)
          : nearest.error
            ? 'Vehicle could not load · tap to retry'
            : 'Loading vehicle…'
        : '';
    button.disabled = busy || (!mounted && !!nearest && !nearest.loaded && !nearest.error);
  }
  return { active: () => !!mounted, vehicleId: () => mounted, drive, update, reconcile };
}
