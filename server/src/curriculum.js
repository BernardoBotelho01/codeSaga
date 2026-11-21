import { validateCode } from './validator.js';

export const languages = ['python', 'java', 'javascript'];
export const POINTS = 20;
const syntax = {
  python: {
    variable: 'moedas = 10',
    text: 'nome = "Luna"',
    boolean: 'portalAberto = True',
    print: 'print(total)',
    numberType: 'int',
    stringType: 'str',
    boolType: 'bool',
    mutable: 'O nome recebe um novo valor com =.',
    true: 'True',
  },
  java: {
    variable: 'int moedas = 10;',
    text: 'String nome = "Luna";',
    boolean: 'boolean portalAberto = true;',
    print: 'System.out.println(total);',
    numberType: 'int',
    stringType: 'String',
    boolType: 'boolean',
    mutable: 'Use = para atualizar uma variável já declarada.',
    true: 'true',
  },
  javascript: {
    variable: 'let moedas = 10;',
    text: 'const nome = "Luna";',
    boolean: 'let portalAberto = true;',
    print: 'console.log(total);',
    numberType: 'number',
    stringType: 'string',
    boolType: 'boolean',
    mutable: 'Declare com let quando o valor precisar mudar. const impede a reatribuição.',
    true: 'true',
  },
};

export function getCourse(language) {
  if (!languages.includes(language)) return null;
  const s = syntax[language];
  const declare = (name, value, type = 'int') =>
    ({
      python: `${name} = ${value}`,
      java: `${type} ${name} = ${value};`,
      javascript: `let ${name} = ${value};`,
    })[language];
  const update = (name, value) => `${name} = ${value}${language === 'python' ? '' : ';'}`;
  const exercises = (mission, values) =>
    values.map((value, index) => ({ ...value, id: `m${mission}-e${index + 1}`, points: POINTS }));
  return {
    language,
    world: 'Vale dos Dados',
    maxXp: 300,
    missions: [
      {
        id: 'm1',
        title: 'O primeiro baú',
        subtitle: 'Guarde uma informação em uma variável.',
        icon: 'chest',
        lesson:
          'Imagine uma variável como um baú com nome. Ela guarda um valor que o programa pode consultar. O sinal = atribui o valor à variável.',
        example: s.variable,
        exercises: exercises(1, [
          {
            type: 'choice',
            question: 'Para que serve uma variável?',
            hint: 'Pense em um baú que recebe um nome e guarda uma informação.',
            options: [
              'Guardar um valor identificado por um nome.',
              'Apagar o programa.',
              'Executar somente jogos.',
              'Transformar todo valor em texto.',
            ],
            answer: 0,
            explanation:
              'Uma variável associa um nome a um valor que pode ser usado pelo programa.',
          },
          {
            type: 'text',
            question: 'Qual valor está guardado em moedas?',
            code: declare('moedas', '8'),
            hint: 'O valor atribuído está depois do sinal =.',
            placeholder: 'Digite somente o valor',
            answers: ['8'],
            explanation: 'O sinal = atribuiu 8 à variável moedas.',
          },
          {
            type: 'code',
            question: 'Crie a variável moedas e guarde o número 10.',
            hint: `Siga o exemplo da missão, usando o nome moedas.`,
            starter: language === 'python' ? '# Guarde dez moedas\n' : '// Guarde dez moedas\n',
            sample: s.variable,
            goal: { variables: { moedas: 10 } },
            explanation: 'Você criou uma variável e atribuiu um número a ela.',
          },
        ]),
      },
      {
        id: 'm2',
        title: 'Tipos de dados',
        subtitle: 'Reconheça textos, números e valores lógicos.',
        icon: 'layers',
        lesson: `Os dados têm tipos. Textos ficam entre aspas e são ${s.stringType}. Números inteiros usam ${s.numberType}. Valores lógicos usam ${s.boolType}.`,
        example: s.text,
        exercises: exercises(2, [
          {
            type: 'choice',
            question: 'Qual é o tipo do valor "Luna"?',
            code: s.text,
            hint: 'As aspas indicam um texto.',
            options: [s.numberType, s.stringType, s.boolType, 'Nenhum tipo'],
            answer: 1,
            explanation: `"Luna" é um texto, representado pelo tipo ${s.stringType}.`,
          },
          {
            type: 'text',
            question: 'Qual é o nome do tipo que representa um número inteiro nesta linguagem?',
            code: declare('idade', '24'),
            hint: `Nesta linguagem, o tipo é ${s.numberType}.`,
            placeholder: 'Digite o tipo',
            answers: [s.numberType],
            explanation: `O valor 24 é um número inteiro. Aqui, seu tipo é ${s.numberType}.`,
          },
          {
            type: 'code',
            question: 'Crie a variável nome com o texto "Luna".',
            hint: 'Respeite o nome e as letras do texto. Use aspas para representar uma String.',
            starter:
              language === 'python'
                ? '# Guarde o nome da exploradora\n'
                : '// Guarde o nome da exploradora\n',
            sample: s.text,
            goal: { variables: { nome: 'Luna' } },
            explanation: 'Seu baú agora guarda um texto.',
          },
        ]),
      },
      {
        id: 'm3',
        title: 'O valor pode mudar',
        subtitle: 'Atualize informações durante a aventura.',
        icon: 'refresh',
        lesson: `${s.mutable} O programa lê as instruções de cima para baixo. Quando o valor muda, a próxima consulta usa o novo valor.`,
        example: `${declare('moedas', '10')}\n${update('moedas', 'moedas + 5')}`,
        exercises: exercises(3, [
          {
            type: 'choice',
            question: 'O que acontece ao atribuir um novo valor a uma variável mutável?',
            hint: 'A atribuição substitui o valor que estava guardado.',
            options: [
              'O programa cria obrigatoriamente outro nome.',
              'Todos os valores desaparecem.',
              'O valor anterior é atualizado.',
              'A variável deixa de existir.',
            ],
            answer: 2,
            explanation: 'A variável continua com seu nome e passa a guardar o novo valor.',
          },
          {
            type: 'text',
            question: 'Qual é o valor final de moedas?',
            code: `${declare('moedas', '5')}\n${update('moedas', 'moedas + 7')}`,
            hint: 'Comece com 5 e acrescente 7.',
            placeholder: 'Digite o valor final',
            answers: ['12'],
            explanation: 'A segunda instrução calcula 5 + 7 e guarda 12 em moedas.',
          },
          {
            type: 'code',
            question: 'Comece com 20 moedas. Depois, acrescente 5 usando moedas + 5.',
            hint: 'São duas instruções. Primeiro declare, depois atualize a variável existente.',
            starter: `${declare('moedas', '20')}\n`,
            sample: `${declare('moedas', '20')}\n${update('moedas', 'moedas + 5')}`,
            goal: { variables: { moedas: 25 } },
            explanation: 'A variável foi atualizada para 25 moedas.',
          },
        ]),
      },
      {
        id: 'm4',
        title: 'Verdadeiro ou falso',
        subtitle: 'Guarde o estado de um portal.',
        icon: 'key',
        lesson: `Um valor lógico representa verdadeiro ou falso. Ele serve para guardar estados, como portal aberto ou fechado. Em ${language === 'python' ? 'Python, escrevemos True e False' : 'Java e JavaScript, escrevemos true e false'}.`,
        example: s.boolean,
        exercises: exercises(4, [
          {
            type: 'choice',
            question: 'Qual informação combina com um valor lógico?',
            hint: 'Valores lógicos representam duas possibilidades.',
            options: [
              'O nome completo do jogador.',
              'A quantidade de moedas.',
              'A mensagem de boas-vindas.',
              'O portal está aberto ou fechado.',
            ],
            answer: 3,
            explanation: 'O estado do portal pode ser representado por verdadeiro ou falso.',
          },
          {
            type: 'text',
            question: 'Qual palavra representa verdadeiro nesta linguagem?',
            hint: 'Confira a palavra usada no exemplo da missão.',
            code: s.boolean,
            placeholder: 'Digite o valor lógico',
            answers: [s.true],
            caseSensitive: language === 'python',
            explanation: `A palavra ${s.true} representa o valor verdadeiro nesta linguagem.`,
          },
          {
            type: 'code',
            question: `Declare portalAberto com o valor ${s.true}.`,
            hint: `Use o nome portalAberto e o tipo lógico adequado.`,
            starter:
              language === 'python'
                ? '# Abra o portal com um valor lógico\n'
                : '// Abra o portal com um valor lógico\n',
            sample: s.boolean,
            goal: { variables: { portalAberto: true } },
            explanation: 'O estado do portal foi guardado em uma variável lógica.',
          },
        ]),
      },
      {
        id: 'm5',
        title: 'Guardião dos dados',
        subtitle: 'Una suas descobertas no desafio final.',
        icon: 'trophy',
        lesson:
          'Agora você sabe guardar valores, reconhecer tipos e atualizar variáveis. Use esses conhecimentos para somar o inventário e mostrar o resultado.',
        example: `${declare('moedas', '12')}\n${declare('bonus', '8')}\n${declare('total', 'moedas + bonus')}\n${s.print}`,
        exercises: exercises(5, [
          {
            type: 'choice',
            question: 'Qual valor representa uma quantidade numérica?',
            hint: 'Um número sem aspas pode ser usado diretamente em uma soma.',
            options: ['"20"', '20', '"vinte"', s.true],
            answer: 1,
            explanation: '20 sem aspas é um número. Com aspas, "20" representa um texto.',
          },
          {
            type: 'text',
            question: 'Qual é o valor final de total?',
            code: `${declare('moedas', '20')}\n${declare('bonus', '8')}\n${declare('total', 'moedas + bonus')}`,
            hint: 'Some os valores das duas primeiras variáveis.',
            placeholder: 'Digite o resultado',
            answers: ['28'],
            explanation: 'O inventário contém 20 + 8, ou seja, 28 moedas.',
          },
          {
            type: 'code',
            question: 'Crie moedas com 12 e bonus com 8. Some os dois em total e imprima total.',
            hint: `Use moedas + bonus. Para mostrar o resultado, escreva ${s.print}`,
            starter: `${declare('moedas', '12')}\n${declare('bonus', '8')}\n`,
            sample: `${declare('moedas', '12')}\n${declare('bonus', '8')}\n${declare('total', 'moedas + bonus')}\n${s.print}`,
            goal: { variables: { moedas: 12, bonus: 8, total: 20 }, output: ['20'] },
            explanation:
              'Você completou o Vale dos Dados. As outras áreas serão lançadas em uma próxima etapa.',
          },
        ]),
      },
    ],
  };
}

export function publicCourse(language) {
  const course = getCourse(language);
  if (!course) return null;
  return {
    ...course,
    missions: course.missions.map((mission) => ({
      ...mission,
      exercises: mission.exercises.map(
        ({ answer, answers, goal, explanation, ...exercise }) => exercise,
      ),
    })),
  };
}

export function gradeExercise(exercise, language, answer) {
  if (exercise.type === 'code') {
    const result = validateCode(answer, language, exercise.goal);
    return { ...result, explanation: result.correct ? exercise.explanation : result.message };
  }
  const normalize = (value) =>
    exercise.caseSensitive ? value.trim() : value.trim().toLocaleLowerCase('pt-BR');
  const correct =
    exercise.type === 'choice'
      ? answer === exercise.answer
      : typeof answer === 'string' &&
        exercise.answers.some((value) => normalize(answer) === normalize(value));
  return {
    correct,
    message: correct ? 'Isso mesmo!' : 'Ainda não. Leia a explicação e tente novamente.',
    explanation: exercise.explanation,
    checks: [],
    output: [],
  };
}
