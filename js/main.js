
// firestore Database 読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  where
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// --- ここから認証機能の追加 ---
// Firebase Authenticationのモジュールをインポート
import {
  getAuth, // Authenticationサービスを取得するための関数
  createUserWithEmailAndPassword, // メール/パスワードで新規ユーザーを作成
  signInWithEmailAndPassword,   // メール/パスワードでログイン
  signInWithPopup,              // ポップアップでプロバイダ（例: Google）ログイン
  GoogleAuthProvider,           // Google認証プロバイダ
  signOut,                      // ログアウト
  onAuthStateChanged            // 認証状態の変化を監視
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
// --- ここまで認証機能の追加 ---

import firebaseConfig from "./firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebaseサービスインスタンスの取得
const db = getFirestore(app);
// --- ここから認証機能の追加 ---
const auth = getAuth(app); // Authenticationサービスのインスタンスを取得
// --- ここまで認証機能の追加 ---

// Firestore Database 読み込み ここまで


const today = new Date();
let month = today.getMonth();
let year = today.getFullYear();


// 見出しの年月と曜日
const days = ['月', '火', '水', '木', '金', '土', '日'];
$("#month").html(year + '年' + (month + 1) + '月');
days.forEach(d => $("#dayLabel").append(`<th class="day_of_week">${d}</th>`));


// 年と月を入力し当月のカレンダーに表示される
// 前月の終わりの日々の配列を作る関数
function getPrevMonthdays(year, month) {
  const prevMonthDate = new Date(year, month, 0);
  const d = prevMonthDate.getDate();
  const prevMonth = prevMonthDate.getMonth() + 1;
  const prevMonthYear = prevMonthDate.getFullYear();
  const startDay = new Date(year, month, 1).getDay();
  const dates = [];
  const numDays = startDay === 0 ? 6 : startDay - 1;
  for (let i = 0; i < numDays; i++) {
    dates.unshift({
      year: prevMonthYear,
      month: prevMonth,
      date: d - i,
      isToday: false,
      isDisabled: true,
      isHoliday: false,
    });
  }
  return dates;
}

getPrevMonthdays(year, month);

// 今月の日々の配列を作る関数
function getCurrentMonthDays(year, month) {
  const dates = [];
  const datesInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= datesInMonth; i++) {
    dates.push({
      year: year,
      month: month + 1,
      date: i,
      isToday: false,
      isDisabled: false,
      isHoliday: false,
    })
  }
  if (year === today.getFullYear() && month === today.getMonth()) {
    dates[today.getDate() - 1].isToday = true;
  }
  return dates;
}

getCurrentMonthDays(year, month);

// 当月のカレンダーに表示される翌月の日々の配列を作る関数
function getNextMonthdays(year, month) {
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonth = nextMonthDate.getMonth() + 1;
  const nextMonthYear = nextMonthDate.getFullYear();
  const dates = [];
  const lastDay = new Date(year, month + 1, 0).getDay();
  if (lastDay !== 0) {
    for (let i = 1; i <= 7 - lastDay; i++) {
      dates.push({
        year: nextMonthYear,
        month: nextMonth,
        date: i,
        isToday: false,
        isDisabled: true,
        isHoliday: false,
      })
    }
  }
  return dates;
}

getNextMonthdays(year, month);

// カレンダーを描画する関数
function makeCalendar(year, month) {

  $("#month").html(year + '年' + (month + 1) + '月');

  $("tbody").empty();
  const dates = [
    ...getPrevMonthdays(year, month),
    ...getCurrentMonthDays(year, month),
    ...getNextMonthdays(year, month),
  ];
  // console.log(dates);

  const weeks = [];
  const weeksCount = dates.length / 7;

  for (let i = 0; i < weeksCount; i++) {
    weeks.push(dates.splice(0, 7));
  }

  for (let i = 0; i < weeksCount; i++) {
    $("tbody").append(`<tr id="row${i}"></tr>`);
    weeks[i].forEach(date => {
      const monthStr = String(date.month).padStart(2, '0');
      const dayStr = String(date.date).padStart(2, '0');
      const dateId = `day${date.year}${monthStr}${dayStr}`;
      // const dateKey = new Date(date.year, date.month - 1, date.date);
      $(`#row${i}`).append(`<td><div id="${dateId}" class="date_box"><div class="day_box">${date.date}</div><div class="multi_day_box"></div><div class=memo_box></div></div></td>`);
      if (date.isToday) {
        $(`#${dateId}>.day_box`).addClass('today');
      }
      if (date.isDisabled) {
        $(`#${dateId}`).addClass('isdisabled');
      }
      if (date.month === 4 && date.date === 11) {
        $(`#${dateId} .day_box`).addClass('moritaka_birthday');
      }
    });
  }
  makeHolidays(); // 祝日を描画する
}

makeCalendar(year, month);

// 祝日APIを使って、今年と来年の祝日データを取得し、祝日表示する関数
function makeHolidays() {
  const url = "https://api.national-holidays.jp/recent";
  axios
    .get(url)
    .then(function (response) {
      const holidays = response.data;
      holidays.forEach(holiday => {
        const holidayName = holiday.name;
        const holidayId = `day${holiday.date.slice(0, 4)}${holiday.date.slice(5, 7)}${holiday.date.slice(8, 10)}`;
        $(`#${holidayId}>.day_box`).addClass('holiday').append(holidayName);
      })
    })
    .catch(function (error) {
      console.error("祝日データの取得に失敗しました：", error);
    })
}


// 「前月」クリックで前月のカレンダーを描画する関数
$("#prev").on("click", function () {
  month--;
  if (month < 0) {
    year--;
    month = 11;
  }
  makeCalendar(year, month);
  renderSchedules(allScheduleData);

});

// 「翌月」クリックで翌月のカレンダーを描画する関数
$("#next").on("click", function () {
  month++;
  if (month > 11) {
    year++;
    month = 0;
  }
  makeCalendar(year, month);
  renderSchedules(allScheduleData);

});

let allScheduleData = []; //グルーバル変数　予定データ全体

//予定データ配列を入力し、予定をカレンダーに表示する。
renderSchedules(allScheduleData); 




// 繰り返し予定：開始日、繰り返しタイプ、終了日を入力し、予定の日付リストを作る
// getRepeatedDates関数を作る
function getRepeatedDate(startDateStr, repeatType, repeatEndStr) {
  const dates = [];
  let current = new Date(startDateStr);
  const repeatEnd = new Date(repeatEndStr);
  const originalDate = current.getDate();
  // 元の日付を保持（その月に存在しない日を処理するため）

  while (current <= repeatEnd) {
    const day = current.getDay();
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (repeatType === "daily" ||
      (repeatType === "weekday" && day >= 1 && day <= 5) ||
      repeatType === "weekly" ||
      repeatType === "monthly") {
      dates.push(dateStr);
      // console.log(dates);
    }
    if (repeatType === "daily" || repeatType === "weekday") {
      current.setDate(current.getDate() + 1); // 1日ずつ進める
    } else if (repeatType === "weekly") {
      current.setDate(current.getDate() + 7); //7日ずつ進める
    } else if (repeatType === "monthly") {
      const nextMonth = current.getMonth() + 1;
      current.setMonth(nextMonth);

      // 月が変わった後、同じ日が存在しない場合（例：2月31日→3月3日）、月末に修正
      if (current.getDate() < originalDate) {
        current.setDate(0);
      }
    } else {
      console.warn(`無効なrepeatType: ${repeatType}`);
      break;
      // repeatTypeに想定外のものが来た時に、currentが変化せず、
      // 永久にcurrent=<repeatEndのままで無限ループになる。それを防止するため
      // break;で強制終了！
    }
  }
  return dates;
}

//予定入力画面で入力した予定をFirebaseに保存する関数
function saveScheduleData() {
  const startDate = $("#startDate").val();
  const endDate = $("#endDate").val();
  const date = $("#dateBoxId").text();
  const title = $("#title").val();
  const start = $("#startTime").val();
  const end = $("#endTime").val();
  const place = $("#place").val();
  const note = $("#note").val();

  const repeat = $("#repeat").val(); //追加
  const repeatEnd = $("#repeatEnd").val(); //追加

  if (!startDate) {
    alert("開始日を入力してください。");
  }

  let dates = [];

  const user = auth.currentUser; // 認証されたユーザー

  if (user) {
    const userId = user.uid;

    if (repeat !== "none" && repeatEnd) {
      dates = getRepeatedDate(startDate, repeat, repeatEnd);
      dates.forEach(day => {
        const scheduleData = {
          startDate: day,
          endDate: day,
          date: `day${day.replace(/-/g, "")}`,
          //正規表現:全ての(=g)"-"を""に置き換える。例2025-06-19→20250619
          title,
          start,
          end,
          place,
          note,
          repeat,
          repeatEnd,
          userId: userId
        };
        addDoc(collection(db, "schedule"), scheduleData); //firebaseに追加
      });
    } else {
      dates = [startDate];
      dates.forEach(day => {
        const scheduleData = {
          startDate: day,
          endDate,
          date: `day${day.replace(/-/g, "")}`,
          title,
          start,
          end,
          place,
          note,
          repeat,
          repeatEnd,
          userId: userId
        };
        addDoc(collection(db, "schedule"), scheduleData);
      });
    }
  } else {
    alert("予定を登録するにはログインしてください！");
    console.warn("未ログインユーザーが予定登録を試みました");
  }
}

// リスナーを解除するための関数を格納する変数
let unsubscribeFromFirestore = null;

// Firestoreから予定データを読み込む関数
function setupFirestoreCalendar(uid) {
  // 既にリスナーが設定されている場合、一度解除してから再設定
  if (unsubscribeFromFirestore) {
    unsubscribeFromFirestore();
    console.log("既存のFirestoreリスナーを解除しました（再設定前）。");
  }
  // ユーザーidが同じもの
  const q = query(collection(db, "schedule"), where("userId", "==", uid), orderBy("startDate"));
  // onSnapshotが返す解除関数を変数に格納する
  unsubscribeFromFirestore = onSnapshot(q, (querySnapshot) => {
    allScheduleData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderSchedules(allScheduleData);
    console.log("取得したFirestoreデータ:", allScheduleData);
  }, (error) => {
    console.error("イベント読み込みエラー（ログイン後）:", error); // 権限エラーの場合、ユーザーにログアウトを促すなどの対応
    if (error.code === "permission-denied") {
      console.warn("Firestoreアクセス権限がありません。ユーザーがログアウトしている可能性があります。");
    }

  });
}


// 予定の配列を入力し、当該日に予定を描画する関数（複数日にまたがる予定も含む）
function renderSchedules(dataArray) {
  $(".memo_box").empty(); //一旦、既存予定を消去
  $(".multi_day_box").empty(); //一旦、既存予定を消去
  dataArray.forEach(item => {
    let curDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);

    const isSameDate =
      curDate.getFullYear() === endDate.getFullYear() &&
      curDate.getMonth() === endDate.getMonth() &&
      curDate.getDate() === endDate.getDate();


    if (isSameDate) { //1日の予定の場合
      const y = curDate.getFullYear();
      const m = (curDate.getMonth() + 1).toString().padStart(2, "0");
      const d = curDate.getDate().toString().padStart(2, "0");
      const dateId = `day${y}${m}${d}`;
      $(`#${dateId} .memo_box`).append(`<div class="memo_box_item" data-id="${item.id}">${item.start}:${item.title}<div>`);
    } else { //複数日にまたがる予定野場合
      while (curDate <= endDate) {
        const y = curDate.getFullYear();
        const m = (curDate.getMonth() + 1).toString().padStart(2, "0");
        const d = curDate.getDate().toString().padStart(2, "0");
        const dateId = `day${y}${m}${d}`;

        $(`#${dateId} .multi_day_box`).append(`<div class="multi_box_item" data-id="${item.id}">${item.start}:${item.title}<div>`);
        curDate.setDate(curDate.getDate() + 1);
      }
    }
  });
}

//予定の保存ボタン処理
$("#save").on("click", function () {
  saveScheduleData();
  $(".overlay").css('display', 'none');
});

// 日付を入力し、時刻をはずず関数
function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// 日をクリックして予定リスト画面を呼出
$("tbody").on("click", ".date_box", function () {

  const user = auth.currentUser;

  if (user) {
    $(".event_overlay").slideDown(300);

    const dateBoxId = $(this).attr('id');
    $("#eventDayId").html(dateBoxId);
    $("#dateBoxId").html(dateBoxId);
    const sheduleDate = `${dateBoxId.slice(3, 7)}年${dateBoxId.slice(7, 9)}月${dateBoxId.slice(9, 11)}日`;
    $("#eventDay").text(sheduleDate);

    $("#eventList").empty(); // 一度リストを初期化

    //予定がはいっていたら、その予定を表示
    const result = $(this).find('.memo_box_item, .multi_box_item');
    if (result.length) {
      const eventList = allScheduleData.filter(item => {
        const curDate = stripTime(new Date(
          dateBoxId.slice(3, 7),
          parseInt(dateBoxId.slice(7, 9)) - 1,
          dateBoxId.slice(9, 11)
        ));

        const start = stripTime(new Date(item.startDate));
        const end = stripTime(new Date(item.endDate));
        return curDate >= start && curDate <= end;
      });

      console.log(eventList);
      eventList.forEach(item => {
        $("#eventList").append(`<li class="eventList_item" data-id="${item.id}">${item.start}：${item.title}</li>`);
      });

    }
  } else {
    alert("予定を登録するにはログインしてください！");
    console.warn("未ログインユーザーが予定登録を試みました");
  }
});

//予定リスト画面のキャンセルボタン
// 予定リスト画面を閉じる
$("#eventCancel").on("click", function () {
  $(".event_overlay").slideUp(300);
});

// "day20250620"を"2025-06-20"に変換する関数
function changeFormatdate(dateBoxId) {
  const yyyy = dateBoxId.slice(3, 7);
  const mm = dateBoxId.slice(7, 9);
  const dd = dateBoxId.slice(9, 11);
  const formattedDate = `${yyyy}-${mm}-${dd}`;
  return formattedDate;
}

let previousOverlay = null;
// 現在の画面状態を記録する変数

// 新規予定入力の表示、日付表示
$("#newEntry").on("click", function () {
  previousOverlay = 'eventList';

  const dateBoxId = $("#dateBoxId").text();
  const formattedDate = changeFormatdate(dateBoxId);

  $("#title").val("");
  $("#startDate").val(formattedDate);
  $("#startTime").val("");
  $("#endDate").val(formattedDate);
  $("#endTime").val("");
  $("#place").val("");
  $("#note").val("");
  $("#repeat").val("");
  $("#repeat").prop("disabled", false);
  $("#repeatEnd").val("");
  $("#repeatEnd").prop("disabled", false);
  const sheduleDate = $("#eventDay").text();
  $("#modalTitle").text(sheduleDate);
  $(".event_overlay").css('display', 'none');
  $(".overlay").css('display', 'block');

  $("#save").hide().show();//保存ボタン表示
  $("#upDate").hide();
  $("#delete").hide();
  //更新ボタン、削除ボタンは削除

});

//既存予定をクリック→予定編集画面に遷移
$("#eventList").on("click", ".eventList_item", function () {

  previousOverlay = 'eventList';

  const id = $(this).attr("data-id");
  const item = allScheduleData.find(item => item.id === id);


  if (item) {

    $("#title").val(item.title);
    $("#startDate").val(item.startDate);
    $("#startTime").val(item.start);
    $("#endDate").val(item.endDate);
    $("#endTime").val(item.end);
    $("#place").val(item.place);
    $("#note").val(item.note);
    $("#repeat").val(item.repeat);
    $("#repeat").prop("disabled", true);
    $("#repeatEnd").val(item.repeatEnd);
    $("#repeatEnd").prop("disabled", true);
    const sheduleDate = $("#eventDay").text();
    $("#modalTitle").text(sheduleDate);
    $("#dateBoxId").text(item.date);
    $("#editingId").val(item.id);
    $(".event_overlay").css('display', 'none');
    $(".overlay").css('display', 'block');

    $("#save").hide();//保存ボタン削除
    $("#upDate").hide().show();
    $("#delete").hide().show();
    //更新ボタン、削除ボタンは表示

  } else {
    alert('該当データがありません')
  }

});

// イベント編集後の更新
$("#upDate").on("click", function () {
  const editingId = $("#editingId").val();
  if (editingId !== "") {
    updateDoc(doc(db, "schedule", editingId), {
      date: $("#dateBoxId").text(),
      title: $("#title").val(),
      startDate: $("#startDate").val(),
      start: $("#startTime").val(),
      endDate: $("#endDate").val(),
      end: $("#endTime").val(),
      place: $("#place").val(),
      note: $("#note").val(),
      repeat: $("#repeat").val(),
      repeatEnd: $("#repeatEnd").val()
    });

    renderSchedules(allScheduleData);

    $(".overlay").css('display', 'none');
  }
});

// イベントの削除
$("#delete").on("click", function () {
  const editingId = $("#editingId").val();

  if (editingId !== "") {
    deleteDoc(doc(db, "schedule", editingId));
    renderSchedules(allScheduleData);
    $(".overlay").css('display', 'none');
  }
});

//予定入力画面のキャンセルボタン
$("#modalCancel").on("click", function () {
  $(".overlay").css('display', 'none');

  if (previousOverlay === 'eventList') {
    $(".event_overlay").css('display', 'block');
  }
  previousOverlay === null;
});

// 壁紙選択関係アクション
$("#selectWallPaper").on("click", function () {
  $(".wallPaper_overlay").css('display', 'block');
});


// 画像選択アクション
let selectedWallPaper = null;//画像パス

$(".wallPaper").on("click", function () {
  $(".wallPaper").removeClass('selected');//初期化、選択状態リセット
  $(this).addClass('selected');
  //クリック画像を選択状態に

  selectedWallPaper = $(this).find("img").attr("src");//選択画像のパスを取得
});

//選択した壁紙へ壁紙の変更、ストレージにパスを保存
$("#wallPaperChange").on("click", function () {
  if (selectedWallPaper) {
    $(".cal_wrapper").css('background-image', `linear-gradient(to top, rgba(217, 175, 217, 0.5) 0%, rgba(151, 217, 225, 0.5) 100%), url(${selectedWallPaper})`);//背景変更

    localStorage.setItem('wallPaper', selectedWallPaper);//ストレージに保存

    $(".wallPaper_overlay").css('display', 'none');

  } else {
    alert('壁紙を選択してください');
  }
});

// ストレージに保存した壁紙の読み込み
$(function () {
  const savedWallPaper = localStorage.getItem('wallPaper');
  if (savedWallPaper) {
    $(".cal_wrapper").css('background-image', `linear-gradient(to top, rgba(217, 175, 217, 0.5) 0%, rgba(151, 217, 225, 0.5) 100%), url(${savedWallPaper})`);
  }
});

// 壁紙選択画面のキャンセル
$("#wallPaperCancelBtn").on("click", function () {
  $(".wallPaper_overlay").css('display', 'none');
});

// 今月に戻るボタン
$("#toThisMonth").on("click", function () {
  const today = new Date();
  year = today.getFullYear();
  month = today.getMonth();
  makeCalendar(year, month);
  renderSchedules(allScheduleData);
});

// --- ここからユーザー登録、ログイン関係 ---
// ログインメニュー画面の表示
$("#loginMenu").on("click", function () {
  $(".login_overlay").slideDown(300);
  $("#loginMenu").hide();
  $("#loginEmail").val("");
  $("#loginPassword").val("");
});

// 新規ユーザー登録
$("#signup-button").on("click", function () {
  const email = $("#loginEmail").val();
  const password = $("#loginPassword").val();
  createUserWithEmailAndPassword(auth, email, password)
    .then(function (userCredential) {
      // 登録成功
      const user = userCredential.user
      console.log("新規ユーザー登録成功:", user.uid);
      alert("ユーザー登録が完了しました！")
    })
    .catch(function (error) {
      // エラー処理
      console.error("ユーザー登録エラー", error.code, error.message);
      alert("ユーザー登録に失敗しました:" + error.message);
    })
  $(".login_overlay").hide();
});

// ログイン（メール／パスワード）
$("#loginButton").on("click", function () {
  const email = $("#loginEmail").val();
  const password = $("#loginPassword").val();
  signInWithEmailAndPassword(auth, email, password)
    .then(function (userCredential) {
      // ログイン成功
      const user = userCredential.user
      console.log("ログイン成功:", user.uid)
      alert("ログインに成功しました！");
    })
    .catch(function (error) {
      // エラー処理
      console.error("ログインエラー", error.code, error.message);
      alert("ログインに失敗しました:" + error.message);
    })
  $(".login_overlay").hide();
});

// Googleログイン
$("#googleLoginButton").on("click", function () {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then(function (result) {
      // Googleログイン成功
      const user = result.user;
      console.log("Googleログイン成功;", user.uid);
      alert("Googleアカウントでログインしました！");
    })
    .catch(function (error) {
      // エラー処理
      console.error("Googleログインエラー:", error.code, error.message);
      alert("Googleログインに失敗しました:" + error.message);
    })
  $(".login_overlay").hide();
});

// ログアウト
$("#logoutBtn").on("click", function () {
  const result = confirm("ログアウトしますか？");
  if (!result) return;
  signOut(auth).then(function () {
    // ログアウト成功
    console.log("ログアウトしました");
    alert("ログアウトしました！");
  }).catch(function (error) {
    // エラー処理
    console.log("ログアウトエラー:", error.message);
    alert("ログアウトに失敗しました:" + error.message);
  })
});

// 認証状態の監視（ページロード時やログイン/ログアウト時に発火）
onAuthStateChanged(auth, (user) => {
  if (user) {
    // ユーザーがログインしている場合
    console.log("現在のユーザー:", user.uid, user.email);
    $("#userDisplayName").text(user.email);
    setupFirestoreCalendar(user.uid);
    $("#loginMenu").hide();
    $(".logout_section").show();
  } else {
    // ユーザーがログアウトしている場合
    console.log("ユーザーはログアウトしています。");
    $(".logout_section").hide();
    $("#loginMenu").show();

    // ---ログアウト時にFirestoreリスナーを解除する---
    if (unsubscribeFromFirestore) {
      unsubscribeFromFirestore(); // リスナーを停止
      unsubscribeFromFirestore = null; // 変数をクリア
      console.log("Firestoreリスナーを解除しました。");
    }
    clearCalendarData();
  }
})

// カレンダーの予定表示をクリアする関数
function clearCalendarData() {
  $(".memo_box").empty(); // 予定の表示を消去
  $(".multi_day_box").empty(); // 予定の表示を消去
  allScheduleData = [];
  console.log("カレンダーデータをクリアしました。")
}

// ログインメニュー画面をキャンセルボタンで閉じる
$("#loginCancel").on("click", function () {
  $(".login_overlay").slideUp(300);
  $("#loginMenu").show();
});
