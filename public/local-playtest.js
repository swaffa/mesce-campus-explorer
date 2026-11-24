import { campusLayout, studentsCorner } from './campus-layout.js';
// Local-only doorway checkpoints. Never active on the published host.
export function localPlaytest({
  player,
  toast,
  resetCamera,
  beforeMove = async () => true,
  inAcademic = () => false,
  inAuditorium = () => false,
  previewTouch = () => {},
  diagnostics = () => ({}),
}) {
  const panel = document.createElement('details');
  panel.id = 'localPlaytest';
  panel.innerHTML = '<summary>Local playtest checkpoints</summary>';
  const points = [
    ['Enter Main Block', -51, -15],
    ['NSS Corner', campusLayout.nss.x, campusLayout.nss.z],
    ['NSS road junction', -89, 3],
    ['IEDC rear path', campusLayout.iedc.x, campusLayout.iedc.z],
    ['River and bridge view', -69, -64],
    ['Enter CSE Block', 12, -14],
    ['Enter EEE Block', 40, -14],
    ['Enter Mechanical Block', 68, -14],
    ['Entrance guard', -56.3, 58],
    ['Gate road', -56, 77],
    ['Roads overview', -70, 78],
    ['Main block guard', -55, -7],
    ['Lexus parking', -16.75, 20.4],
    ['Honda parking', -9.75, 20.4],
    ['Bike parking', -81, 60],
    ['Mechanical flowering tree', 64, -6],
    ['Parking guard', campusLayout.parking.x + 20, 20],
    ['Campus dogs', -73, 50],
    ['Fountain steps', -51, 15.4],
    ['Corner middle step', studentsCorner.x, studentsCorner.z + 4.45],
    ['Students’ Corner', studentsCorner.x, studentsCorner.z + 7.2],
    ['Main masjid', -39, 64],
    ['Women’s masjid', -3.4, 64],
    ['Library door', campusLayout.library.doorX, campusLayout.library.doorZ],
    ['Auditorium steps', campusLayout.auditorium.dx, 30.6 + campusLayout.auditorium.dz],
    ['Canteen', campusLayout.canteen.x, campusLayout.canteen.z + 7],
    ['Facilities overview', 24, 30],
    ['CSE garden', 12, -10],
    ['Main–CS shaded path', -9, -27],
    ['CS to forecourt crossing', 12, 6],
    ['Inside hall: Centre aisle', 0, 2],
    ['Inside hall: Stage steps', 0, -12],
  ];
  const academicPoints = [
    ['Inside block: Corridor', 0, 0],
    ['Inside block: Classroom chair', -18, -10.5],
    ['Inside block: Classroom aisle', -21.2, -6],
    ['Inside block: Teaching platform', -21, -17],
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
    } else if (name.startsWith('Inside hall:')) {
      if (!inAuditorium()) {
        toast('Enter the auditorium first.');
        return;
      }
    } else if (!(await beforeMove())) return;
    player.position.set(x, 0, z);
    resetCamera(name);
    document.getElementById('menu').close();
    toast('Local checkpoint: ' + name);
  };
  panel.append(label, select, go);
  const touchLabel = document.createElement('label');
  const touch = document.createElement('input');
  touch.type = 'checkbox';
  touch.checked = document.body.classList.contains('touch-controls');
  touchLabel.append(touch, ' Preview tablet controls');
  touch.onchange = () => previewTouch(touch.checked);
  const readout = document.createElement('output');
  readout.id = 'localDiagnostics';
  readout.setAttribute('aria-label', 'Local game diagnostics');
  readout.style.cssText =
    'position:fixed;left:20px;top:140px;pointer-events:none;background:#faf5e9d9;color:#234b3e;padding:6px 10px;border-radius:6px;font:10px monospace;z-index:3';
  document.body.append(readout);
  const timer = setInterval(() => {
    readout.textContent = JSON.stringify(diagnostics());
  }, 200);
  addEventListener('pagehide', () => clearInterval(timer), { once: true });
  panel.append(touchLabel);
  document.getElementById('menu').append(panel);
}
