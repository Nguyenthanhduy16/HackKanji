export const gamification = {sentenceXP:2, lessonXP:20, shadowingXP:3, reviewXP:1, checkInDango:50, freezePrice:50, maxFreeze:7, milestones:[3,7,14,30,60,90,120,180,270,365], milestoneRewards:[20,50,100,200,350,500,700,1000,1800,3000], missionTargets:[1,3,5,1], missionXP:[10,20,30,50], missionDango:[10,15,20,25]};
export const levelThreshold=(level:number)=>level<=1?0:50+88*(level-1);
export function levelForXP(xp:number){let level=1;while(xp>=levelThreshold(level+1))level++;return level;}
