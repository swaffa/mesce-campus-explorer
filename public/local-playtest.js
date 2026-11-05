import { campusLayout } from './campus-layout.js';
// Local-only doorway checkpoints. Never active on the published host.
export function localPlaytest({
  player,
  toast,
  resetCamera,
  beforeMove = async () => true,
  inAcademic = () => false,
}) {
  const panel = document.createElement('details');
  panel.id = 'localPlaytest';
  panel.innerHTML = '<summary>Local playtest checkpoints</summary>';
  const points = [
    ['Enter Main Block', -51, -15],
    ['Enter CSE Block', 12, -14],
    ['Enter EEE Block', 40, -14],
    ['Enter Mechanical Block', 68, -14],
    ['Entrance guard', -56.3, 58],
    ['Main block guard', -55, -7],
    ['Parking guard', 17, 20],
    ['Campus dogs', -73, 50],
    ['Fountain steps', -51, 15.4],
    ['Students’ Corner', -81, 38],
    ['Main masjid', -39, 64],
    ['Women’s masjid', -3.4, 64],
    ['Library door', campusLayout.library.doorX, campusLayout.library.doorZ],
    ['Auditorium steps', campusLayout.auditorium.dx, 30.6 + campusLayout.auditorium.dz],
    ['Canteen', campusLayout.canteen.x, campusLayout.canteen.z + 7],
    ['Facilities overview', 50, 35],
    ['CSE garden', 12, -10],
  ];
  const academicPoints = [
    ['Inside block: Corridor', 0, 0],
    ['Inside block: Classroom chair', -18, -10.5],
    ['Inside block: Lab', -10.5, -10],
    ['Inside block: Seminar hall', 7, -7],
    ['Inside block: Staffroom', 24, -14],
    ['Inside block: Water filter', 4.15, 2.4],
    ['Inside block: Lift', 7.5, 6.1],
    ['Inside block: Stairs bottom', -6.5, 6],
    ['Inside block: Stairs landing', -6.5, 15.2],
    ['Inside block: Men’s washroom', 17.5, 6.5],
    ['Inside block: Women’s washroom', 24.5, 6.5],
  ];
  points.push(...academicPoints);
  const label = document.createElement('label');
  label.textContent = 'Choose checkpoint';
  label.htmlFor = 'localCheckpoint';
  const select = document.createElement('select');
  select.id = 'localCheckpoint';
  for (const [name] of points) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.append(option);
  }
  const go = document.createElement('button');
  go.textContent = 'Go to checkpoint';
  go.onclick = async () => {
    const [name, x, z] = points.find((p) => p[0] === select.value);
    if (name.startsWith('Inside block:')) {
      if (!inAcademic()) {
        toast('Enter an academic block first.');
        return;
      }
    } else if (!(await beforeMove())) return;
    player.position.set(x, 0, z);
    resetCamera(name);
    document.getElementById('menu').close();
    toast('Local checkpoint: ' + name);
  };
  panel.append(label, select, go);
  document.getElementById('menu').append(panel);
}
