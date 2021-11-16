import React, {useEffect, useState} from "react";
import {Button, message} from "antd";
import {
    getUsers,
    countNewMessages,
    findChatMessages,
    findChatMessage,
    getUserContacts,
    addToUserContacts,
    getCurrentUser,
    getUserContactByFriendName,
    getUserByLogin,
    getUserIdByLogin, getUserContactersNamesByLogin, addToContactlist, getContactList,
} from "../util/ApiUtil.js";
import {useRecoilValue, useRecoilState} from "recoil";
import {
    loggedInUser,
    chatActiveContact,
    chatMessages,
} from "../atom/globalState.js";
import ScrollToBottom from "react-scroll-to-bottom";
import "./Chat.css";
import "../profile/Profile"
import {SearchOutlined} from "@ant-design/icons";
import {Contact} from "./Contact";

var stompClient = null;
const Chat = (props) => {
    const currentUser = useRecoilValue(loggedInUser);
    const [text, setText] = useState("");
    const [contacts, setContacts] = useState([]);
    const [names, setNames] = useState([]);
    const [username, setUsername] = useState("");
    const [activeContact, setActiveContact] = useRecoilState(chatActiveContact);
    const [messages, setMessages] = useRecoilState(chatMessages);
    const [list, setList] = useState([]);

    useEffect(() => {
        if (localStorage.getItem("accessToken") === null) {
            props.history.push("/login");
        }
        connect();
        //loadContactByLoginFromServer(currentUser.username);
        //loadContacts(); // использовалось для чата
    }, []);

    useEffect(() => {
        if (activeContact === undefined) return;
        findChatMessages(activeContact.id, currentUser.id).then((msgs) =>
            setMessages(msgs)
        );
        //loadContactByLoginFromServer(currentUser.username);
        //loadContacts(); //- грузило состояние users, когда создаёшь 3+ пользователей
    }, [activeContact]);

    //Соединение с Stomp клиентом мессенджера
    const connect = () => {
        const Stomp = require("stompjs");
        var SockJS = require("sockjs-client");
        SockJS = new SockJS("http://localhost:8080/ws");
        stompClient = Stomp.over(SockJS);
        stompClient.connect({}, onConnected, onError);
    };

    //Динамическая подгрузка сообщений в чате
    const onConnected = () => {
        console.log("connected");
        console.log(currentUser);
        stompClient.subscribe(
            "/user/" + currentUser.id + "/queue/messages",
            onMessageReceived
        );
    };

    //Обработчик ошибок
    const onError = (err) => {
        console.log(err);
    };

    //Уведомление о получении сообщения
    const onMessageReceived = (msg) => {
        const notification = JSON.parse(msg.body);
        const active = JSON.parse(sessionStorage.getItem("recoil-persist")).chatActiveContact;

        if (active.id === notification.senderId) {
            findChatMessage(notification.id).then((message) => {
                const newMessages = JSON.parse(sessionStorage.getItem("recoil-persist")).chatMessages;
                newMessages.push(message);
                setMessages(newMessages);
            });
        } else {
            message.info("Received a new message from " + notification.senderName);
        }
        //loadContactByLoginFromServer(currentUser.username);
    };

    //Отправка сообщения человеку из контактов
    const sendMessage = (msg) => {
        if (msg.trim() !== "") {
            const message = {
                senderId: currentUser.id,
                recipientId: activeContact.id,
                senderName: currentUser.name,
                recipientName: activeContact.name,
                content: msg,
                timestamp: new Date(),
            };
            stompClient.send("/app/chat", {}, JSON.stringify(message));

            const newMessages = [...messages];
            newMessages.push(message);
            setMessages(newMessages);
        }
    };

    //Используется для чат версии
    const loadContacts = () => {

        const promise = getUsers().then((users) =>
            users.map((contact) =>
                countNewMessages(contact.id, currentUser.id).then((count) => {
                    contact.newMessages = count;
                    return contact;
                }))
        );

        promise.then((promises) =>
            Promise.all(promises).then((users) => {
                setContacts(users);
                if (activeContact === undefined && users.length > 0) {
                    setActiveContact(users[0]);
                }
            })
        );
    };

    const addContactToDB = (e) =>{
        e.preventDefault();

        console.log(username);
        console.log(currentUser.username);

        if(getUserContactByFriendName(currentUser.username, username)){
            console.log(addToUserContacts(currentUser.username, username));
            console.log(getUserContactByFriendName(currentUser.username, username));
        }

        console.log(getCurrentUser());

        loadContactByLoginFromServer(username);
    }

    //Используется для мессенджер версии
    const loadContactByLoginFromServer = (userName) => {

        console.log(userName);
        console.log("getUserContacts(currentUser.username)");
        console.log(getUserContacts(currentUser.username));

        console.log(getUserContactersNamesByLogin(currentUser.username));

        const promise = getUserContacts(currentUser.user).then((users) =>
            users.map((contact) =>
                countNewMessages(contact.id, currentUser.id).then((count) => {
                    contact.newMessages = count;
                    return contact;
                }))
        );

        contactActivator(promise);
    };

    const addToContactList = (e) =>{
        e.preventDefault();

        console.log(username);
        console.log(currentUser.username);

        if(!getUserContactByFriendName(currentUser.username, username)){
            console.log(addToUserContacts(currentUser.username, username));
            console.log(getUserContactByFriendName(currentUser.username, username));

            console.log(addToContactlist(currentUser.username, username));
            console.log(getContactList(currentUser.username));
        }

        console.log(getCurrentUser());
        //loadContactList(username);
        //loadContactByLoginFromServer(currentUser.username);
    }

    //Используется для мессенджер версии
    const loadContactList = (e) => {
        e.preventDefault(); //Глушилка обновления

        let users = [];
        list.push(username);
        console.log("list");
        console.log(list);
        list.map((name) => users.push(getUserByLogin(name)));
        console.log("users");
        console.log(users);

        const promise = list.map((name) => getUserByLogin(name).then((users) =>
            users.map((contact) =>
                countNewMessages(contact.id, currentUser.id).then((count) => {
                    contact.newMessages = count;
                    return contact;
                }))
        ));

        promise.then((promises) =>
            Promise.all(promises).then((users) => {
                setContacts(users); //Устанавливает картинку и имя контакта
                if (activeContact === undefined && users.length > 0) {
                    setActiveContact(users[0]);
                }
            })
        );
    };

    const contactActivator = (promise) =>{

    };

    const toProfile = () => {
        props.history.push("/login");
    };

    return (
        <div id="frame">
            <div id="sidepanel">
                <div id="profile">
                    <div class="wrap">
                        <img
                            id="profile-img"
                            src={currentUser.profilePicture}
                            class="online"
                            alt=""
                        />
                        <p>{currentUser.name}</p>
                        <div id="status-options">
                            <ul>
                                <li id="status-online" class="active">
                                    <span class="status-circle"></span> <p>Online</p>
                                </li>
                                <li id="status-away">
                                    <span class="status-circle"></span> <p>Away</p>
                                </li>
                                <li id="status-busy">
                                    <span class="status-circle"></span> <p>Busy</p>
                                </li>
                                <li id="status-offline">
                                    <span class="status-circle"></span> <p>Offline</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div id="search">
                    <form>
                        <input
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            type="text"
                            placeholder="Search"
                        />
                        <button onClick={loadContactList}>
                            <SearchOutlined/>
                        </button>
                    </form>
                </div>
                <div id="contacts">
                    <ul>
                        {contacts.map((contact) => (
                            <li
                                onClick={() => setActiveContact(contact)}
                                class={
                                    activeContact && contact.id === activeContact.id
                                        ? "contact active"
                                        : "contact"
                                }
                            >

                                <div className="wrap" >
                                    <span className="contact-status online"></span>
                                    <img id={contact.id} src={contact.profilePicture} alt=""/>
                                    <div className="meta">
                                        <p className="name">{contact.name}</p>
                                        {contact.newMessages !== undefined &&
                                        contact.newMessages > 0 && (
                                            <p className="preview">
                                                {contact.newMessages} new messages
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div id="bottom-bar">
                    <button id="addcontact" onClick={toProfile}>
                        <i class="fa fa-user fa-fw" aria-hidden="true"></i>{" "}
                        <span>Profile</span>
                    </button>
                    <button id="settings">
                        <i class="fa fa-cog fa-fw" aria-hidden="true"></i>{" "}
                        <span>Settings</span>
                    </button>
                </div>
            </div>
            <div class="content">
                <div class="contact-profile">
                    <img src={activeContact && activeContact.profilePicture} alt=""/>
                    <p>{activeContact && activeContact.name}</p>
                </div>
                <ScrollToBottom className="messages">
                    <ul>
                        {messages.map((msg) => (
                            <li class={msg.senderId === currentUser.id ? "sent" : "replies"}>
                                {msg.senderId !== currentUser.id && (
                                    <img src={activeContact.profilePicture} alt=""/>
                                )}
                                <p>{msg.content}</p>
                            </li>
                        ))}
                    </ul>
                </ScrollToBottom>
                <div class="message-input">
                    <div class="wrap">
                        <input
                            name="user_input"
                            size="large"
                            placeholder="Write your message..."
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            onKeyPress={(event) => {
                                if (event.key === "Enter") {
                                    sendMessage(text);
                                    setText("");
                                }
                            }}
                        />

                        <Button
                            icon={<i class="fa fa-paper-plane" aria-hidden="true"></i>}
                            onClick={() => {
                                sendMessage(text);
                                setText("");
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>


    );
};

export default Chat;
