import Route from '@ember/routing/route';
import { service } from '@ember/service';
import {
  getPrNumber,
  getPrNumbers,
  newestPrNumber
} from 'screwdriver-ui/utils/pipeline/pull-request';

export default class V2PipelinePullsShowRoute extends Route {
  @service shuttle;

  async model(params) {
    const model = this.modelFor('v2.pipeline.pulls');
    const { pipeline, pullRequestJobs } = model;
    const pipelineId = pipeline.id;
    const pullRequestIds = getPrNumbers(pullRequestJobs);
    const prNum = parseInt(params.pull_request_number, 10);

    let latestEvent;

    let event;

    if (pullRequestIds.has(prNum)) {
      event = await this.shuttle
        .fetchFromApi('get', `/pipelines/${pipelineId}/events?prNum=${prNum}`)
        .then(events => {
          return events[0];
        });
      latestEvent = event;
    } else {
      const newestPrNum = newestPrNumber(pullRequestIds);

      latestEvent = await this.shuttle
        .fetchFromApi(
          'get',
          `/pipelines/${pipelineId}/events?prNum=${newestPrNum}`
        )
        .then(events => {
          return events[0];
        });
    }

    let jobs = [];

    if (event && !pipeline.chainPR) {
      jobs = await this.shuttle.fetchFromApi(
        'get',
        `/pipelines/${pipelineId}/jobs?type=pipeline`
      );

      model.pullRequestJobs.forEach(prJob => {
        if (getPrNumber(prJob) === prNum) {
          jobs.push({ ...prJob, group: prNum });
        }
      });
    }

    return {
      ...model,
      jobs,
      event,
      latestEvent,
      invalidEvent: event === undefined
    };
  }
}
