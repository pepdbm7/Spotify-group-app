// const iTunesLogic = require('../services/iTunesLogic')
// const {User, Playlist, Track} = require('../datalayer/user')
// let localStorage = require('localStorage')

//comentar para testear:
import data from "../datalayer/user";
import iTunesLogic from "../services/iTunesLogic";
require("isomorphic-fetch");
const { User, Track, Playlist } = data;

const userService = {
  getSessionFromStorage() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user === undefined) throw Error("The user has not session");
    else return user;
  },

  registerUser({ name, surname, email, username, password }) {
    let user = new User();
    user.Email = email;
    user.Name = name;
    user.surname = surname;
    user.username = username;
    user.password = password;

    return fetch("https://skylabcoders.herokuapp.com/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(user)
    })
      .then(res => res.json())

      .then(res => {
        if (res.error) throw Error(res.error);

        return true;
      });
  },

  getUserFromData(data) {
    return User.createUserFromData(data);
  },

  authenticateUser(username, password) {
    if (typeof username !== "string")
      throw TypeError(`username is not a string`);
    if (typeof password !== "string")
      throw TypeError(`pasword is not a string`);
    if (!username.trim().length) throw TypeError(`username is empty`);
    if (!password.trim().length) throw TypeError(`password is empty`);

    return fetch("https://skylabcoders.herokuapp.com/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ username, password })
    })
      .then(user => user.json())
      .then(({ data, error }) => {
        if (error) throw Error(error);

        return { id: data.id, token: data.token };
      })
      .then(data => localStorage.setItem("user", JSON.stringify(data)));
  },

  getUserInfo(id, token) {
    if (typeof id !== "string") throw TypeError(`id is not a string`);
    if (typeof token !== "string") throw TypeError(`token is not a string`);
    if (!id.trim()) throw TypeError(`id is empty`);
    if (!token.trim()) throw TypeError(`token is empty`);

    return fetch(`https://skylabcoders.herokuapp.com/api/user/${id}`, {
      mehtod: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(({ status, data, error }) => {
        if (status === "OK") {
          return data;
        } else throw Error(error);
      });
  },

  updateUser(id, token, user) {
    return fetch(`https://skylabcoders.herokuapp.com/api/user/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(user)
    })
      .then(res => res.json())
      .then(res => res.status === "OK" && true);
  },

  createPlayList(value) {
    if (typeof value !== "string")
      throw TypeError(`search criteria is not a string`);
    if (typeof value !== "string") throw TypeError(`search criteria is empty`);

    return iTunesLogic
      .createPlaylist(value)
      .then(res => {
        let playlist = new Playlist();
        playlist.Id = res.id;
        playlist.Name = value;
        playlist.Image = "playlist.png";
        return playlist;
      })
      .then(playlist => {
        const session = JSON.parse(localStorage.getItem("user"));
        if (!session) throw Error("The session of the user has fisnihed");
        const res = {
          id: session.id,
          token: session.token,
          playlist: playlist
        };
        return res;
      })
      .then(obj => {
        return this.getUserInfo(obj.id, obj.token).then(res => {
          obj.userInf = res;
          return obj;
        });
      })
      .then(res => {
        let user = new User();
        user.playLists = res.userInf.playLists;
        user.createPlayList(res.playlist);
        res.userInf = user;
        return res;
      })
      .then(data => {
        return (
          this.updateUser(data.id, data.token, data.userInf) &&
          data.userInf.playLists
        );
      });
  },

  addTrackToPlayList(trackId, playlistId, user) {
    return iTunesLogic
      .getTrack(trackId)
      .then(data => {
        let track = Track.createTrackFromData(data);
        return track;
      })
      .then(track => {
        let playList = user.playLists.find(
          playList => playList.id === playlistId
        );
        playList.tracks.push(track);
        const session = this.getSessionFromStorage();
        return this.updateUser(session.id, session.token, user);
      });
  },

  existsTrackInPlayList(data, trackId) {
    let user = new User();
    for (let p in data) {
      user[p] = data[p];
    }
    return user.existsTrackInPlayList(trackId);
  },

  getUserPlayLists() {
    const session = JSON.parse(localStorage.getItem("user"));
    if (!session) throw Error("The session of the user has fisnihed");

    return this.getUserInfo(session.id, session.token).then(
      res => res.playLists
    );
  },

  deletePlayList(playlistId) {
    const { id, token } = JSON.parse(localStorage.getItem("user"));
    if (!id) throw Error("The session of the user has fisnihed");
    return this.getUserInfo(id, token)
      .then(res => {
        res.playLists = res.playLists.filter(el => el.id !== playlistId);
        return res;
      })
      .then(user => {
        return this.updateUser(id, token, user).then(res => {
          return user;
        });
      });
  }
};

// descomentar para la aplicacion
export default userService;

//descomentar para test
// module.exports = userService
