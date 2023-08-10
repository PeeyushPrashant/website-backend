const userQuery = require("../models/users");
const members = require("../models/members");
const { ROLE_LEVEL, ROLE_ACCESS, ACCESS_LEVEL } = require("../constants/userDataLevels");

const retrieveUsers = async ({
  id = null,
  username = null,
  usernames = null,
  query = null,
  userdata,
  level = ACCESS_LEVEL.PUBLIC,
  role = null,
}) => {
  if (id || username) {
    let result;
    if (id != null) {
      result = await userQuery.fetchUser({ userId: id });
    } else {
      result = await userQuery.fetchUser({ username: username });
    }
    const user = levelSpecificAccess(result.user, level, role);
    result.user = user;
    return result;
  } else if (usernames) {
    const { users } = await userQuery.fetchUsers(usernames);
    const result = [];
    users.forEach((userdata) => {
      const user = levelSpecificAccess(userdata, level, role);
      result.push(user);
    });
    return result;
  } else if (query) {
    const { allUsers, nextId, prevId } = await userQuery.fetchPaginatedUsers(query);
    const users = [];
    allUsers.forEach((userdata) => {
      const user = levelSpecificAccess(userdata, level, role);
      users.push(user);
    });
    return { users, nextId, prevId };
  } else {
    const result = await userQuery.fetchUser({ userId: userdata.id });
    return levelSpecificAccess(result.user, level, role);
  }
};

const retrieveDiscordUsers = async (level = ACCESS_LEVEL.PUBLIC, role = null) => {
  const users = await userQuery.getDiscordUsers();
  const usersData = [];
  users.forEach((userdata) => {
    const user = levelSpecificAccess(userdata, level, role);
    usersData.push(user);
  });
  return usersData;
};

const retreiveFilteredUsers = async (query) => {
  const users = await userQuery.getUsersBasedOnFilter(query);
  users.forEach((userdata) => {
    removeSensitiveInfo(userdata);
  });
  return users;
};

const retrieveMembers = async (query) => {
  const allUsers = await members.fetchUsers(query);
  allUsers.forEach((userdata) => {
    removeSensitiveInfo(userdata);
  });
  return allUsers;
};

const retrieveUsersWithRole = async (role) => {
  const users = await members.fetchUsersWithRole(role);
  users.forEach((userdata) => {
    removeSensitiveInfo(userdata);
  });
  return users;
};

const removeSensitiveInfo = function (obj, level = ACCESS_LEVEL.PUBLIC) {
  for (let i = 0; i < ROLE_ACCESS[level].length; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, ROLE_ACCESS[level][i])) {
      delete obj[ROLE_ACCESS[level][i]];
    }
  }
};

const levelSpecificAccess = (user, level = ACCESS_LEVEL.PUBLIC, role = null) => {
  if (level === ACCESS_LEVEL.PUBLIC || ROLE_LEVEL[level].includes(role)) {
    removeSensitiveInfo(user, level);
    return user;
  }
  return "unauthorized";
};

module.exports = {
  retrieveUsers,
  removeSensitiveInfo,
  retrieveDiscordUsers,
  retrieveMembers,
  retrieveUsersWithRole,
  retreiveFilteredUsers,
  levelSpecificAccess,
};
