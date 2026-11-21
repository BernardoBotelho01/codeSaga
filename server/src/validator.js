// Interpretador didático do Mundo 1. Nenhum código do jogador é executado pelo Node.
// A gramática aceita declarações, atribuições, aritmética e uma forma de impressão.
const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
const reserved = new Set([
  'let',
  'const',
  'var',
  'int',
  'double',
  'String',
  'boolean',
  'true',
  'false',
  'True',
  'False',
  'print',
  'console',
  'System',
  '__proto__',
  'constructor',
  'prototype',
]);

function statements(source, language) {
  const result = [];
  let current = '';
  let quote = '';
  let escaped = false;
  let comment = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (comment && char !== '\n') continue;
    if (comment) comment = false;
    if (quote) {
      current += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (
      (language === 'python' && char === '#') ||
      (language !== 'python' && char === '/' && source[index + 1] === '/')
    ) {
      comment = true;
      continue;
    }
    if (char === '\n' || char === ';') {
      if (current.trim()) result.push(current.trim());
      current = '';
    } else current += char;
  }
  if (quote) throw new Error('Feche as aspas do texto.');
  if (current.trim()) result.push(current.trim());
  if (result.length > 25) throw new Error('Use até 25 instruções neste desafio.');
  return result;
}

function tokenize(expression) {
  const tokens = [];
  const pattern =
    /\s*(\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[A-Za-z_][A-Za-z0-9_]*|[()+\-*/])/y;
  let position = 0;
  while (position < expression.trimEnd().length) {
    pattern.lastIndex = position;
    const match = pattern.exec(expression);
    if (!match) throw new Error('Use valores, variáveis e os operadores +, -, * ou /.');
    tokens.push(match[1]);
    position = pattern.lastIndex;
  }
  if (tokens.length > 150)
    throw new Error('A expressão ficou grande. Divida em variáveis menores.');
  return tokens;
}

function readString(token) {
  if (token[0] === '"') return JSON.parse(token);
  return token
    .slice(1, -1)
    .replace(/\\([\\'"nrt])/g, (_, char) => ({ n: '\n', r: '\r', t: '\t' })[char] ?? char);
}

function evaluate(expression, variables, language) {
  const tokens = tokenize(expression);
  let index = 0;
  function primary() {
    const token = tokens[index++];
    if (!token) throw new Error('Complete o valor depois do sinal de igual.');
    if (token === '(') {
      const value = binary(0);
      if (tokens[index++] !== ')') throw new Error('Feche os parênteses.');
      return value;
    }
    if (token === '-' || token === '+') {
      const value = primary();
      if (!['int', 'float'].includes(value.type))
        throw new Error('O sinal precisa acompanhar um número.');
      return { type: value.type, value: token === '-' ? -value.value : value.value };
    }
    if (/^\d/.test(token))
      return { value: Number(token), type: token.includes('.') ? 'float' : 'int' };
    if (token.startsWith('"') || token.startsWith("'")) {
      if (language === 'java' && token.startsWith("'"))
        throw new Error('Em Java, use aspas duplas para String.');
      return { value: readString(token), type: 'string' };
    }
    const booleans =
      language === 'python' ? { True: true, False: false } : { true: true, false: false };
    if (Object.hasOwn(booleans, token)) return { value: booleans[token], type: 'boolean' };
    if (!variables.has(token))
      throw new Error(`A variável ${token} precisa ser declarada antes do uso.`);
    return variables.get(token);
  }
  function binary(minimum) {
    let left = primary();
    while (Object.hasOwn(precedence, tokens[index]) && precedence[tokens[index]] >= minimum) {
      const operation = tokens[index++];
      const right = binary(precedence[operation] + 1);
      if (operation === '+' && (left.type === 'string' || right.type === 'string')) {
        if (language === 'python' && (left.type !== 'string' || right.type !== 'string'))
          throw new Error('Some textos com textos e números com números.');
        left = { type: 'string', value: String(left.value) + String(right.value) };
        continue;
      }
      if (![left.type, right.type].every((type) => ['int', 'float'].includes(type)))
        throw new Error('Esta operação precisa de valores numéricos.');
      if (operation === '/' && right.value === 0)
        throw new Error('A divisão por zero não é válida.');
      const operators = {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
      };
      let value = operators[operation](left.value, right.value);
      const integerDivision =
        language === 'java' && operation === '/' && left.type === 'int' && right.type === 'int';
      if (integerDivision) value = Math.trunc(value);
      const type =
        left.type === 'float' ||
        right.type === 'float' ||
        (language === 'python' && operation === '/')
          ? 'float'
          : 'int';
      if (!Number.isFinite(value) || Math.abs(value) > 1e12)
        throw new Error('Use números entre -1 trilhão e 1 trilhão.');
      left = { type, value };
    }
    return left;
  }
  const result = binary(0);
  if (index !== tokens.length)
    throw new Error('Confira os espaços, operadores e parênteses da expressão.');
  return result;
}

export function interpret(source, language) {
  if (!['python', 'java', 'javascript'].includes(language)) throw new Error('Linguagem inválida.');
  if (typeof source !== 'string' || !source.trim() || source.length > 2000)
    throw new Error('Escreva uma solução com até 2.000 caracteres.');
  const variables = new Map();
  const output = [];
  for (const statement of statements(source, language)) {
    const outputPatterns = {
      python: /^print\((.*)\)$/,
      javascript: /^console\.log\((.*)\)$/,
      java: /^System\.out\.println\((.*)\)$/,
    };
    const print = statement.match(outputPatterns[language]);
    if (print) {
      const result = evaluate(print[1], variables, language);
      const rendered =
        result.type === 'boolean' && language === 'python'
          ? result.value
            ? 'True'
            : 'False'
          : String(result.value);
      output.push(rendered);
      continue;
    }
    const assignment = statement.match(
      /^(?:(let|const|var|int|double|String|boolean)\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/,
    );
    if (!assignment)
      throw new Error(
        'Neste mundo, use declaração, atribuição ou impressão. Confira o exemplo da missão.',
      );
    const [, declaration, name, expression] = assignment;
    if (reserved.has(name))
      throw new Error('Escolha um nome de variável diferente de uma palavra reservada.');
    if (language === 'python' && declaration)
      throw new Error('Em Python, escreva nome = valor, sem let ou tipo antes do nome.');
    if (language === 'javascript' && declaration && !['let', 'const', 'var'].includes(declaration))
      throw new Error('Em JavaScript, declare a variável com let ou const.');
    if (
      language === 'java' &&
      declaration &&
      !['int', 'double', 'String', 'boolean'].includes(declaration)
    )
      throw new Error('Em Java, declare com int, double, String ou boolean.');
    if (language !== 'python' && !declaration && !variables.has(name))
      throw new Error(`Declare ${name} antes de atribuir um valor.`);
    if (declaration && variables.has(name))
      throw new Error(`A variável ${name} já foi declarada. Use apenas ${name} = novoValor.`);
    if (variables.get(name)?.constant)
      throw new Error(`${name} foi declarada com const. Use let para permitir alterações.`);
    const result = evaluate(expression, variables, language);
    const declaredType =
      language === 'java' ? declaration || variables.get(name)?.declaredType : undefined;
    const allowed = {
      int: ['int'],
      double: ['int', 'float'],
      String: ['string'],
      boolean: ['boolean'],
    };
    if (declaredType && !allowed[declaredType].includes(result.type))
      throw new Error(`O valor não corresponde ao tipo ${declaredType} de ${name}.`);
    variables.set(name, {
      ...result,
      type: declaredType === 'double' ? 'float' : result.type,
      declaredType,
      constant: declaration === 'const',
    });
  }
  return { variables, output };
}

export function validateCode(source, language, goal) {
  try {
    const result = interpret(source, language);
    const checks = Object.entries(goal.variables).map(([name, value]) => ({
      label: `Valor de ${name}`,
      passed: result.variables.has(name) && result.variables.get(name).value === value,
    }));
    if (goal.output)
      checks.push({
        label: 'Saída no console',
        passed: JSON.stringify(result.output) === JSON.stringify(goal.output),
      });
    const correct = checks.every((check) => check.passed);
    return {
      correct,
      checks,
      output: result.output,
      message: correct
        ? 'Todos os testes passaram. Seu código resolveu a missão!'
        : 'O código foi lido. Ajuste os valores para passar nos testes da missão.',
    };
  } catch (error) {
    return { correct: false, checks: [], output: [], message: error.message };
  }
}
