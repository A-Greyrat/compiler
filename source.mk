{
    int a;
    int b;
    int[10] arr;

    a = 10;
    b = 2;

    // Swap a and b
    a = a + b;
    b = a - b;
    a = a - b;

    arr[0] = a;
    arr[1] = b;

    while (a != 0) {
        a = a - 1;
        b = b + 1;
    }

    if (a == 0) {
        arr[2] = 10000 + a - b;
        arr[3] = 20000 + a + b;
    } else {
        arr[4] = 30000 + a - b;
        arr[5] = 40000 + a + b;
    }
}
