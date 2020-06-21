const {describe, before, after, it} = require('mocha');
const {expect} = require('chai');
// const {Builder, Capabilities, By} = require('selenium-webdriver');
const mochaWebdriver = require('mocha-webdriver');
// eslint-disable-next-line node/no-unpublished-require
const app = require('../build/app');
let server = undefined,
  myDriver = undefined;

const EXPRESS_PORT = 6969;
const ROOT_URL = `http://localhost:${EXPRESS_PORT}`;
const LOGIN_URL = ROOT_URL + '/login';
const LOGOUT_URL = ROOT_URL + '/logout';
const PASS_URL = ROOT_URL + '/pass';

async function logIn(username, pass) {
  await myDriver.get(LOGIN_URL);
  await myDriver.find('input[name="login"]').sendKeys(username);
  await myDriver.find('input[name="pass"]').sendKeys(pass);
  await myDriver.find('input[type="submit"]').click();
}

async function logOut() {
  await myDriver.get(LOGOUT_URL);
}

async function changePass(oldPass, newPass) {
  await myDriver.get(PASS_URL);
  await myDriver.find('input[name="oldPass"]').sendKeys(oldPass);
  await myDriver.find('input[name="newPass"]').sendKeys(newPass);
  await myDriver.find('input[type="submit"]').click();
}

const getQuizSelectOption = async quizNr =>
  myDriver.find(`option[value="${quizNr}"]`);

async function startQuiz(quizNr) {
  await myDriver.find(`option[value="${quizNr}"]`).click();
  await myDriver.find('button[type="submit"]').click();
}

const getQuestionNr = async () =>
  Number(await myDriver.find('span[class="question-nr"]').getText());
const getNextBtn = async () =>
  await myDriver.find('button[class="next-inline"]');

describe('Quiz tests', async function () {
  this.timeout(40000);

  before(done => {
    mochaWebdriver.createDriver().then(driver => {
      myDriver = driver;
      server = app.listen(EXPRESS_PORT, 'localhost', done);
    });
  });

  after(done => {
    myDriver.close();
    server.close(done);
  });

  it('Downloads quiz questions from server', async () => {
    await logIn('user1', 'user1');
    // Now we are on homepage as logged ussers
    await startQuiz('1');

    const nextBtn = await getNextBtn();
    let questionNr = 0,
      currQuestionNr;
    while ((currQuestionNr = await getQuestionNr()) > questionNr) {
      const questionStatement = await myDriver
        .find('code[data-bind="statement"]')
        .getText();
      // Check if questions have loaded correctly.
      expect(questionStatement).to.have.lengthOf.above(3);
      questionNr = currQuestionNr;
      await nextBtn.click();
    }
    // Number of questions from test 1 should be 9.
    expect(questionNr).to.equal(9);
    await logOut();
  });

  it('Checks that one cannot do the same quiz twice', async () => {
    await logIn('user1', 'user1');
    await startQuiz('1');
    const nextBtn = await getNextBtn();
    const finishBtn = await myDriver.find('button[class="finish"]');
    while (!(await finishBtn.isEnabled())) {
      await myDriver.find('input[name="answer"]').sendKeys('1');
      await nextBtn.click();
    }
    await finishBtn.click();

    await myDriver.get(ROOT_URL);
    const quizOption = await getQuizSelectOption('1');
    const enabled = await quizOption.isEnabled();
    expect(enabled).to.be.false;
    await logOut();
  });

  it('Checks that all user sessions are logged out on password change', async () => {
    const loggedIn = async () => {
      try {
        await myDriver.find('a[href="/logout"]');
      } catch (err) {
        return false;
      }
      return true;
    };
    await logIn('user2', 'user2');
    let logged = await loggedIn();
    expect(logged).to.be.true;
    const sessionCookie = await myDriver.manage().getCookie('connect.sid');

    await changePass('user2', 'user1');

    await myDriver
      .manage()
      .addCookie({name: sessionCookie.name, value: sessionCookie.value});
    await myDriver.get(ROOT_URL);
    logged = await loggedIn();

    expect(logged).to.be.false;
    // Cleanup
    await logIn('user2', 'user1');
    await changePass('user1', 'user2');
    logged = await loggedIn();

    expect(logged).to.be.false;
  });
});
