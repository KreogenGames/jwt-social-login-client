import {useRecoilValue} from "recoil";
import {loggedInUser} from "../atom/globalState";
import React, {useEffect, useState} from "react";

export function Contact() {
    const currentUser = useRecoilValue(loggedInUser);
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [names, setNames] = useState([]);

    // Note: the empty deps array [] means
    // this useEffect will run once
    // similar to componentDidMount()
    useEffect(() => {
        fetch("http://localhost:8081/users/" + currentUser.username + "/contacts/names")
            .then(res => res.json())
            .then(
                (result) => {
                    setIsLoaded(true);
                    setNames(result);
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    setIsLoaded(true);
                    setError(error);
                }
            )
    }, [])
}