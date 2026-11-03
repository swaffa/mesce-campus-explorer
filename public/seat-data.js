import {campusLayout} from './campus-layout.js';
export const campusSeats=[];
function add(id,area,label,x,z,height,yaw=0){campusSeats.push({id,area,label,x,z,height,yaw});}
for(const [row,z]of [-8.5,-5,-1.5,2,5.5,9].entries())for(const [column,x]of [-12,-9,-6,6,9,12].entries())add(`hall-${row}-${column}`,'auditorium','auditorium chair',x,z,.775,Math.PI);
for(const [tableX,x]of [28.5,36.5].entries())for(const [tableZ,z]of [26,30].entries())for(const [place,dx]of [-1.5,0,1.5].entries())for(const side of [-1,1])add(`canteen-${tableX}-${tableZ}-${place}-${side}`,'campus','canteen seat',x+dx+campusLayout.canteen.dx,z+side*1.35+campusLayout.canteen.dz,.675,side>0?Math.PI:0);
for(const [i,[x,z]]of [[-11,-13],[2,-13],[-75,39],[25,37],[44,35],[-58,13]].entries())for(const side of [-1,1])add(`bench-${i}-${side}`,'campus','campus bench',x+side*.7,z+.25,.85);
for(const [i,[x,z]]of [[-89,45],[-88,40]].entries())for(const side of [-1,1])add(`corner-${i}-${side}`,'campus','shaded bench',x+side*.7,z,.89);
for(let i=0;i<6;i++){const a=i*Math.PI/3;add(`tree-${i}`,'campus','tree bench',-93+Math.sin(a)*2.45,43+Math.cos(a)*2.45,.95,a);}
for(const [i,x]of [-88,-82].entries())for(const side of [-1,1])for(const place of [-1,1])add(`snack-${i}-${side}-${place}`,'campus','snack corner bench',x+place*.65,33+side,.75,side>0?Math.PI:0);
for(const [ti,x]of [-5,5].entries())for(const [ri,z]of [-3,4].entries())for(const side of [-1,1])for(const [pi,dx]of [-.9,.9].entries())add(`library-${ti}-${ri}-${side}-${pi}`,'library','reading chair',x+dx,z+side*1.8,.8,side>0?Math.PI:0);
for(const area of ['masjid','women-masjid'])for(const [r,z]of [-6,-1,4].entries())for(const [c,x]of [-4,0,4].entries()){add(`prayer-${area}-${r}-${c}`,area,'prayer mat',x,z,.12,Math.PI);campusSeats.at(-1).kind='prayer';}
