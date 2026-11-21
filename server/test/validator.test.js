import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourse, languages, publicCourse } from '../src/curriculum.js';
import { interpret, validateCode } from '../src/validator.js';

test('todos os desafios das três linguagens aceitam o exemplo de solução', () => {
  for (const language of languages) {
    const course = getCourse(language);
    assert.equal(course.missions.length, 5);
    for (const exercise of course.missions
      .flatMap((mission) => mission.exercises)
      .filter((item) => item.type === 'code')) {
      assert.equal(
        validateCode(exercise.sample, language, exercise.goal).correct,
        true,
        `${language}: ${exercise.id}`,
      );
    }
    const published = publicCourse(language);
    for (const exercise of published.missions.flatMap((mission) => mission.exercises)) {
      assert.equal(Object.hasOwn(exercise, 'answer'), false);
      assert.equal(Object.hasOwn(exercise, 'goal'), false);
    }
  }
});

test('o interpretador aceita variações válidas de espaços, comentários e expressões', () => {
  assert.equal(
    interpret('moedas= 2 * (3 + 2) # comentário', 'python').variables.get('moedas').value,
    10,
  );
  assert.equal(
    interpret('let moedas=4; moedas = moedas + 6; // comentário', 'javascript').variables.get(
      'moedas',
    ).value,
    10,
  );
  assert.equal(interpret('int moedas = 21 / 2;', 'java').variables.get('moedas').value, 10);
  assert.equal(interpret('texto = "a;#b"\nprint(texto)', 'python').output[0], 'a;#b');
});

test('bloqueia execução externa, laços, acesso a objetos e sintaxe fora do laboratório', () => {
  for (const source of [
    'process.exit()',
    'while(true) {}',
    'let x = globalThis;',
    'console.log(process.env)',
    'let x = (function(){})()',
  ]) {
    assert.throws(() => interpret(source, 'javascript'));
  }
  assert.throws(() => interpret('import os\nos.system("echo teste")', 'python'));
  assert.throws(() => interpret('Runtime.getRuntime()', 'java'));
});

test('respeita reatribuição de const, tipos Java e booleanos Python', () => {
  assert.throws(() => interpret('const moedas=10;moedas=20;', 'javascript'), /const/);
  assert.throws(() => interpret('int moedas="dez";', 'java'), /tipo/);
  assert.throws(() => interpret('portalAberto=true', 'python'));
  assert.equal(interpret('portalAberto=True', 'python').variables.get('portalAberto').value, true);
});
