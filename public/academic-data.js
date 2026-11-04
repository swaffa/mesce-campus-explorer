// An original playable interior layout; these are not surveyed college floor plans.
export const academicBlocks=[
 {id:'main',name:'Main Block',x:-51,z:-17.2,lab:'Computer lab'},
 {id:'cse',name:'CS · BCA · ADS · Cyber',x:12,z:-16.1,lab:'Computing lab'},
 {id:'eee',name:'EEE · ECE',x:40,z:-16.1,lab:'Circuits & electronics lab'},
 {id:'mech',name:'Mechanical Block',x:68,z:-16.1,lab:'Mechanical workshop'}
];
export const academicFloors=['Ground floor','First floor','Second floor'];
export const academicAreas=academicBlocks.flatMap(b=>academicFloors.map((_,f)=>'block-'+b.id+'-'+f));
export const academicSeatSpots=[
 ...[-24.5,-18].flatMap((x,c)=>[-12.5,-8.5].map((z,r)=>({id:'class-'+c+'-'+r,label:'classroom chair',x,z:z+1.25,height:.8,yaw:Math.PI}))),
 ...[-10.5,-3.5].flatMap((x,c)=>[-12,-7.5].map((z,r)=>({id:'lab-'+c+'-'+r,label:'lab stool',x,z:z+1.2,height:.82,yaw:Math.PI}))),
 ...[3.5,7,10.5].flatMap((x,c)=>[-12,-8].map((z,r)=>({id:'seminar-'+c+'-'+r,label:'seminar chair',x,z,height:.8,yaw:Math.PI}))),
 ...[18,24].map((x,i)=>({id:'staff-'+i,label:'staffroom chair',x,z:-10.2,height:.8,yaw:Math.PI})),
 ...[-24,-19,-14].map((x,i)=>({id:'lounge-'+i,label:'common room bench',x,z:11,height:.85,yaw:0}))
];
export function academicZone(area,x,z){
 if(!academicAreas.includes(area))return area;
 if(z< -4)return area+':'+(x< -14?'classroom':x<0?'lab':x<14?'seminar':'staffroom');
 if(z>4){if(x> -10&&x< -3)return area+':stairs';if(x< -3)return area+':common';if(x>14)return area+':'+(x<21?'men-washroom':'women-washroom');if(x>3&&x<12&&z>8)return area+':lift';}
 return area+':corridor';
}
export function academicStairHeight(x,z){if(Math.abs(x+6.5)>2.4||z<7.7||z>16.2)return 0;return z>=14.3?2.31:Math.min(2.31,Math.max(0,Math.ceil((z-7.7)/.6)*.21));}
