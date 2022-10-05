import { currentURL, visit, fillIn, click } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
let server;

module('Acceptance |user-settings', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        1018240: {
          showPRJobs: true
        },
        1048190: {
          showPRJobs: false
        },
        displayJobNameLength: 30
      })
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /user-settings/preferences', async function (assert) {
    await authenticateSession({ token: 'faketoken' });
    await visit('/user-settings/preferences');

    assert.equal(currentURL(), '/user-settings/preferences');
    assert.dom('section.preference li').exists({ count: 2 });
  });

  test('update displayJobNameLength', async function (assert) {
    server.put('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1'
      })
    ]);

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);
    const controller = this.owner.lookup('controller:user-settings/preference');

    await authenticateSession({ token: 'faketoken' });
    await visit('/user-settings/preferences');

    assert.equal(currentURL(), '/user-settings/preferences');
    await fillIn('.display-job-name', 50);

    await click('button.blue-button');
    assert.dom('.display-job-name').hasValue(50);
    assert.deepEqual(
      controller.get('successMessage'),
      'User settings updated successfully!'
    );
  });
});