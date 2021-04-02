// external dependencies
import VueI18n from 'vue-i18n';
import Vue from 'vue';

// internal translation messages
import en_US from '@/language/en-US.json';

// external translation messages
import enValidationMessages from 'vee-validate/dist/locale/en.json';

const messages = {
    'en-US': { ...en_US, validation: enValidationMessages.messages },
};

const navLang = navigator.language;
const localLang = navLang === 'zh-CN' || navLang === 'en-US' ? navLang : false;
const lang = window.localStorage.getItem('locale') || localLang || 'en-US';

Vue.use(VueI18n);

const i18n = new VueI18n({
    locale: lang,
    messages,
    silentTranslationWarn: true,
});

// @ts-ignore
Vue.use({ i18n: (key, value) => i18n.t(key, value) });
window.localStorage.setItem('locale', lang);

export default i18n;
