import ServicesProvider, {Services} from "../Services/Services";

export interface PersistenceProvider {
    execute: <U>(update : (s: Services) => U) => Promise<U>,
    read: () => Promise<Services>;
}

export default function Persistence<T>(openRw : () => Promise<T>, commit: (t: T) => boolean, abort : (t : T) => void, openR: () => Promise<T>, s : ServicesProvider<T>) : PersistenceProvider {
    return {
        read: (async () => {
            const r = await openR();
            return s.services(r);
        }),
        execute: (async u => {
            const rw = await openRw();
            try {
                const services = s.services(rw);
                const result = await u(services);
                const committed = await commit(rw);
                if (committed) {
                    return result;
                }
            } catch (ex) {
                await abort(rw);
                throw ex;
            }
            await abort(rw);
            throw new Error("Unable to commit transaction");
        })
    }
}