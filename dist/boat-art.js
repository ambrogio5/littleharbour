/** Photographic boat cutouts. Heading zero points the bow to the right. */
export function fleetHull(type){
 const boat=type==='coaster'?'coaster':'cutter';
 return `<span class="fleet-hull boat-art boat-art-${boat}" aria-hidden="true"><span class="boat-wake"></span><span class="boat-waterline"></span><span class="boat-model"></span></span>`;
}
