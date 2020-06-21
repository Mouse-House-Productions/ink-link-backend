import ServicesProvider, {Services} from "../Services/Services";

export interface PersistenceProvider {
    execute: <U>(update : (s: Services) => U) => Promise<U>,
    read: () => Promise<Services>;
}

export default function Persistence<T>(openRw : () => Promise<T>, commit: (t: T) => Promise<any>, abort : (t : T) => void, openR: () => Promise<T>, release: (t : T) => void, s : ServicesProvider<T>) : PersistenceProvider {
    return {
        read: (async () => {
            const r = await openR();
            try {
                return s.services(r);
            } finally {
                release(r);
            }
        }),
        execute: (async u => {
            const rw = await openRw();
            try {
                const services = s.services(rw);
                const result = await u(services);
                await commit(rw);
                return result;
            } catch (ex) {
                await abort(rw);
                throw ex;
            } finally {
                release(rw);
            }
        })
    }
}