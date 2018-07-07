import _ from 'lodash';
import db from '../../helper/Database.js';

const state = {
};

const getters = {
};

const mutations = {
};

const actions = {
  async openLink({rootState}, {url, keyModifier, keyModifierType}) {
    if (!url) {
      return ;
    }
    let keyModifierTypeList = ['openBgTabModifier', 'openActTabModifier', 'openCurTabModifier'];
    if (_.isUndefined(keyModifierType)) {
      keyModifierType = _.find(keyModifierTypeList, (_keyModifierType) => {
        return rootState.settings.settings[_keyModifierType] === keyModifier;
      })
    }
    if (!rootState.keywords.isDdgSpecialKeyword) {
      let foundLink = await db.visitedlinks.where({
        link: url,
        search_keyword: rootState.keywords.currentKeyword,
      }).limit(1).first();
      if (!foundLink) {
        await db.visitedlinks.add({
          link: url,
          search_keyword: rootState.keywords.currentKeyword,
          timestamp: new Date().valueOf(),
        });
      } else {
        await db.visitedlinks.where({id: foundLink.id}).modify({timestamp: new Date().valueOf()});
      }
    }
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      let tab = tabs[0];
      switch (keyModifierType) {
      case 'openBgTabModifier':
        chrome.tabs.create({
          url,
          active: false,
          index: tab.index + 1,
        });
        break;
      case 'openActTabModifier':
        chrome.tabs.create({
          url,
          active: true,
          index: tab.index + 1,
        });
        break;
      case 'openCurTabModifier':
        chrome.tabs.update(tab.id, {url});
        setTimeout(() => {
          window.close();
        }, 500);
        break;
      }
    });
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};

