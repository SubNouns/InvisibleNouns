import {useMemo} from "react";
import {useLocation} from 'react-router-dom';

export function useId() {
    const { search } = useLocation();
    return useMemo(() => {
        const query = new URLSearchParams(search);
        let id = parseInt(query.get('id'));
        if (isNaN(id)) return -1;
        if (id < 0) return 0;
        return id;
    }, [search]);
}