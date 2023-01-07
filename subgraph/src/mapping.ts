import { Transfer } from '../generated/Take/Take'
import { Take as TakeContract } from '../generated/Take/Take'
import { Remix, Take } from '../generated/schema'

export function handleNewTake(event: Transfer): void {    
    let id = event.params.id;

    // A transfer from 0x0 is a mint.
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    let isMint = event.params.from.toHexString() == zeroAddress
    
    // Ignore if not a mint.
    if (!isMint) {
        return;
    }
    
    // Instantiate the contract so we can get the take details.
    let takeContract = TakeContract.bind(event.address);

    // Create the take.
    let i = new Take(id.toHexString())
    i.creator = event.params.to.toHexString();
    i.description = takeContract.getTakeText(id);
    i.numRemixes = 0;
    i.save();

    // Check if this is a remix.
    let refs = takeContract.getTakeRefs(id);
    let isRemix = refs[0].isZero()
    if (!isRemix) {
        return;
    }

    // Index the remix.
    let remixId = id.toHexString() + '-' + refs[0].toHexString();
    let remix = new Remix(remixId)
    remix.source = refs[0].toHexString();
    remix.remix = id.toHexString();
    remix.save();
}
