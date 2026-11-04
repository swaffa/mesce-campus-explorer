import fs from 'node:fs';
import path from 'node:path';
const assets={};
function walk(dir){for(const n of fs.readdirSync(dir)){const p=path.join(dir,n);if(fs.statSync(p).isDirectory())walk(p);else{const ext=path.extname(p);const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'}[ext]||'text/plain';assets['/'+path.relative('public',p).replaceAll('\\','/')]={body:fs.readFileSync(p,'utf8'),type};}}}
walk('public');
let code=fs.readFileSync('worker/index.js','utf8').replace("import { assets } from './assets.js';",()=> 'const assets='+JSON.stringify(assets)+';');
const academicData=fs.readFileSync('public/academic-data.js','utf8').replaceAll('export const','const').replaceAll('export function','function');
const voiceSpace=fs.readFileSync('public/voice-space.js','utf8').replace("import {academicZone} from './academic-data.js';",academicData).replace('export function canHearVoice','function canHearVoice');
code=code.replace("import {academicAreas} from '../public/academic-data.js';",academicData);
const community=fs.readFileSync('worker/community-api.js','utf8').replace("import {canHearVoice} from '../public/voice-space.js';",voiceSpace).replace('export async function communityRoute','async function communityRoute');
code=code.replace("import {communityRoute} from './community-api.js';",()=> 'const communityRoute=(()=>{'+community+';return communityRoute;})();');
const layoutData=fs.readFileSync('public/campus-layout.js','utf8').replaceAll('export const','const');
const lifeData=fs.readFileSync('public/campus-life-data.js','utf8').replace("import {campusLayout} from './campus-layout.js';",layoutData).replaceAll('export const','const');
const economy=fs.readFileSync('worker/economy-api.js','utf8').replace("import {shops,fruitTrees} from '../public/campus-life-data.js';",lifeData).replace('export async function economyRoute','async function economyRoute');
code=code.replace("import {economyRoute} from './economy-api.js';",()=> 'const economyRoute=(()=>{'+economy+';return economyRoute;})();');
const seatData=fs.readFileSync('public/seat-data.js','utf8').replace("import {campusLayout} from './campus-layout.js';",layoutData).replace("import {academicAreas,academicSeatSpots} from './academic-data.js';",academicData).replaceAll('export const','const');
const seating=fs.readFileSync('worker/seating-api.js','utf8').replace("import {campusSeats} from '../public/seat-data.js';",seatData).replace('export async function seatingRoute','async function seatingRoute').replace('export {campusSeats};','');
code=code.replace("import {seatingRoute,campusSeats} from './seating-api.js';",()=> 'const {seatingRoute,campusSeats}=(()=>{'+seating+';return {seatingRoute,campusSeats};})();');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});fs.writeFileSync('dist/server/index.js',code);fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built shared-campus Worker, '+Object.keys(assets).length+' assets.');
