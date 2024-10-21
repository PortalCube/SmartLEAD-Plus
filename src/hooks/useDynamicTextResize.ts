import React, { useEffect, useRef, useState } from "react";

export function useDynamicTextResize(
    text: string,
    initialSize: number,
    minSize: number
): [React.RefObject<HTMLElement>, number] {
    const ref = useRef<HTMLElement>(null);
    const [size, setSize] = useState<number>(initialSize);

    useEffect(() => {
        if (!ref || !ref.current) {
            return;
        }

        const cur = ref.current;

        if (size > minSize) {
            if (cur.scrollWidth > cur.clientWidth) {
                setSize((size) => size - 1);
            }
        } else {
            setSize(minSize);
        }
    }, [ref, text, size]);

    return [ref, size];
}
