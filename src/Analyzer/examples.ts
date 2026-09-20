export const codeExamples: Record<string, string> = {
valido: `program TestValido {
    const int LIMIT = 5;
    int count = 0;
    string msg = "Iteracion:";
    stack<int> numeros;
    numeros.push(5);

    for (int i = 0; i < LIMIT; i = i + 1) {
        print(msg);
        print(i);
    }

    if (count == 0) {
        print("Conteo inicializado correctamente");
    }
}`,

errores: `program TestErrores {
    const int MAX = 100;
    int x = 10;

    // Error 1: variable no declarada
    y = 20;

    // Error 2: modificar constante
    MAX = 200;

    // Error 3: condicion no booleana
    if (x) {
        print("Error");
    }

    // Error 4: tipo incompatible
    x = "Hola Mundo";

    // Error 5: read() hacia constante
    read(MAX);
}`,

scope: `program TestScope {
    if (true) {
        int temp = 42;
    }
    // Error: 'temp' solo existe dentro del if
    print(temp);
}`,

arrays: `program ArrayDemo {
    int[] numbers = [10, 20, 30];
    int first = numbers[0];
    numbers[1] = 50;
    print(numbers[1]);
}`,

stack: `program StackTest {
    stack<int> numbers;
    numbers.push(10);

    while (numbers.size() > 0) {
        print(numbers.pop());
    }
}`,
};

export const codeExamplesLabels: Record<string, string> = {
    valido: 'Válido',
    errores: 'Errores semánticos',
    scope: 'Scope',
    arrays: 'Arrays',
    stack: 'Stack + while',
};
