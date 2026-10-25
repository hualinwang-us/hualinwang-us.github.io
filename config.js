/* 华邻网 settings — edit this file on GitHub to change them. */
window.HL_CONFIG = {
  // Public address of the site (used for share links). Change this when you add your own domain.
  siteUrl: "https://hualinwang-us.github.io/",

  // Supabase (free) for classifieds. Fill both to turn on posting.
  supabaseUrl: "https://wkiviznpdcjubyqfovfx.supabase.co",
  supabaseKey: "sb_publishable_IeP_U-Y62FQ02vrENmlmwg_LtZxVL6G",   // the "publishable" / anon key, safe to be public

  // Sign-in methods. Turn each on after it's set up in Supabase (see README).
  loginEmail: false,
  loginGoogle: false,

  // Optional: an email address raises the free translation allowance from about 5,000 to 50,000 characters a day.
  translateEmail: "huamai.us@gmail.com",

  // Shown on empty ad spaces and in the footer so businesses can reach you.
  adContact: { phone: "516-628-7119", wechat: "", email: "" },

  // Prices shown on the "了解广告位" page, in the same order as the ad spaces listed there. Change freely.
  adPrices: ["$200/月", "$100/月 每个", "$60/月 每个", "$60/月 每个", "$40/月 每个板块", "$40/月", "$50/月", "$40/月", "$50/月", "$30/月", "$30/月 每个"],
  pinPrice: "$10/周 · $30/月",
  ypPrice: "$30/月",
  launchOffer: "开站优惠：前3个月所有广告半价；前100位发帖免费置顶7天。"
};
