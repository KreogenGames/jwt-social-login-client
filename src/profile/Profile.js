import React, {useEffect} from "react";
import {Card, Avatar} from "antd";
import {useRecoilState} from "recoil";
import {loggedInUser} from "../atom/globalState";
import {LogoutOutlined} from "@ant-design/icons";
import {MessageOutlined} from "@ant-design/icons";
import {getCurrentUser} from "../util/ApiUtil.js";
import "./Profile.css";
import "../chat/Chat.css";

const {Meta} = Card;


const Profile = (props) => {
    const [currentUser, setLoggedInUser] = useRecoilState(loggedInUser);

    useEffect(() => {
        if (localStorage.getItem("accessToken") === null) {
            props.history.push("/login");
        }
        loadCurrentUser();
    }, []);


    const loadCurrentUser = () => {
        getCurrentUser()
            .then((response) => {
                setLoggedInUser(response);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        props.history.push("/login");
    };

    const toChat = () => {
        props.history.push("/chat");
    };

    return (
        <div className="profile-container">
            <Card
                style={{width: 420, border: "1px solid #e1e0e0"}}
                actions={[<LogoutOutlined onClick={logout}/>]}
            >

                <Meta
                    avatar={
                        <Avatar
                            src={currentUser.profilePicture}
                            className="user-avatar-circle"
                        />
                    }
                    title={currentUser.name}
                    description={"@" + currentUser.username}
                />
                <button onClick={toChat}>To chat page <MessageOutlined /></button>
            </Card>
        </div>
    );

};


export default Profile;


