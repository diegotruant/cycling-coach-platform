import { WorkoutDefinition, WorkoutStep } from './protocols';

export function generateZWO(workout: WorkoutDefinition, ftp: number = 250): string {
  const stepsXml = workout.steps.map(step => {
    let powerLow = 0;
    let powerHigh = 0;

    // Handle different power formats
    // Handle different power formats
    // Handle different power formats
    if (!step.power) {
      powerLow = 0;
      powerHigh = 0;
    } else if (typeof step.power === 'number') {
      // Library: Relative (e.g. 0.5)
      powerLow = step.power;
      powerHigh = step.power;
    } else if (typeof step.power === 'object') {
      const p = step.power as any;
      if ('target' in p) {
        // AI: Absolute Watts -> Relative
        const target = p.target;
        powerLow = target / ftp;
        powerHigh = target / ftp;
      } else if ('min' in p && 'max' in p) {
        const avg = (p.min + p.max) / 2;
        powerLow = avg / ftp;
        powerHigh = avg / ftp;
      } else if ('start' in p && 'end' in p) {
        // Library Ramp: Relative
        powerLow = p.start;
        powerHigh = p.end;
      }
    }

    // ZWO uses relative power (0.5 = 50% FTP)
    // Duration in seconds

    if (step.type === 'RAMP' || (typeof step.power !== 'number' && 'start' in step.power)) {
      return `    <Ramp Duration="${step.duration}" PowerLow="${powerLow}" PowerHigh="${powerHigh}">
      <TEXT>${step.text || ''}</TEXT>
    </Ramp>`;
    }

    if (step.type === 'WARMUP') {
      return `    <Warmup Duration="${step.duration}" PowerLow="${powerLow * 0.5}" PowerHigh="${powerHigh}">
      <TEXT>${step.text || ''}</TEXT>
    </Warmup>`;
    }

    if (step.type === 'COOLDOWN') {
      return `    <Cooldown Duration="${step.duration}" PowerLow="${powerLow}" PowerHigh="${powerLow * 0.5}">
      <TEXT>${step.text || ''}</TEXT>
    </Cooldown>`;
    }

    // Steady state
    return `    <SteadyState Duration="${step.duration}" Power="${powerLow}">
      <TEXT>${step.text || ''}</TEXT>
    </SteadyState>`;
  }).join('\n');

  return `<workout_file>
  <author>DDTraining</author>
  <name>${workout.name}</name>
  <description>${workout.description}</description>
  <sportType>bike</sportType>
  <tags>
    <tag name="TEST"/>
  </tags>
  <workout>
${stepsXml}
  </workout>
</workout_file>`;
}

export function generateMRC(workout: WorkoutDefinition, ftp: number = 250): string {
  const header = `[COURSE HEADER]
VERSION = 2
UNITS = ENGLISH
DESCRIPTION = ${workout.description}
FILE NAME = ${workout.name}
MINUTES PERCENT
[COURSE DATA]
`;

  let currentTime = 0;
  const dataPoints: string[] = [];

  workout.steps.forEach(step => {
    let startPower = 0;
    let endPower = 0;

    if (!step.power) {
      startPower = 0;
      endPower = 0;
    } else if (typeof step.power === 'number') {
      startPower = step.power * 100;
      endPower = step.power * 100;
    } else if (typeof step.power === 'object') {
      const p = step.power as any;
      if ('target' in p) {
        const target = p.target;
        startPower = (target / ftp) * 100;
        endPower = (target / ftp) * 100;
      } else if ('min' in p && 'max' in p) {
        const avg = (p.min + p.max) / 2;
        startPower = (avg / ftp) * 100;
        endPower = (avg / ftp) * 100;
      } else if ('start' in p && 'end' in p) {
        startPower = p.start * 100;
        endPower = p.end * 100;
      }
    }

    dataPoints.push(`${(currentTime / 60).toFixed(2)}\t${startPower.toFixed(0)}`);
    currentTime += step.duration;
    dataPoints.push(`${(currentTime / 60).toFixed(2)}\t${endPower.toFixed(0)}`);
  });

  return header + dataPoints.join('\n') + '\n[END COURSE DATA]';
}

export function generateERG(workout: WorkoutDefinition, ftp: number = 250): string {
  const header = `[COURSE HEADER]
VERSION = 2
UNITS = ENGLISH
DESCRIPTION = ${workout.description}
FILE NAME = ${workout.name}
FTP = ${ftp}
[COURSE DATA]
`;

  let currentTime = 0;
  const dataPoints: string[] = [];

  workout.steps.forEach(step => {
    let startPower = 0;
    let endPower = 0;

    if (!step.power) {
      startPower = 0;
      endPower = 0;
    } else if (typeof step.power === 'number') {
      startPower = step.power * ftp;
      endPower = step.power * ftp;
    } else if (typeof step.power === 'object') {
      const p = step.power as any;
      if ('target' in p) {
        const target = p.target;
        startPower = target;
        endPower = target;
      } else if ('min' in p && 'max' in p) {
        const avg = (p.min + p.max) / 2;
        startPower = avg;
        endPower = avg;
      } else if ('start' in p && 'end' in p) {
        startPower = p.start * ftp;
        endPower = p.end * ftp;
      } else {
        // Fallback
        startPower = 0;
        endPower = 0;
      }
    }

    dataPoints.push(`${(currentTime / 60).toFixed(2)}\t${startPower.toFixed(0)}`);
    currentTime += step.duration;
    dataPoints.push(`${(currentTime / 60).toFixed(2)}\t${endPower.toFixed(0)}`);
  });

  return header + dataPoints.join('\n') + '\n[END COURSE DATA]';
}
