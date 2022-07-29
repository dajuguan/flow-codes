
export const LISRT_DAPPY_TEMPLATES = `
import DappyCollection from 0xDappy 

pub fun main(): {UInt32: DappyCollection.Template}{
    return DappyCollection.listTemplates()
}
` 