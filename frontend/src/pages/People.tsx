import { useEffect } from "react";
import { usePeopleStore } from "../stores/peopleStore";

export default function People() {
    const { people, loading, error, fetchPeople } = usePeopleStore();

    useEffect(() => {
        fetchPeople();
    }, []);

    console.log(people)

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            {people.map((p) => (
                <div key={p.url}>{p.name}</div>
            ))}
        </div>
    );
}