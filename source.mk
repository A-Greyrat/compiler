{
    int a;
    int b;
    int c;
    int d;
    boolean pending;

    a = 1;
    b = 1;
    c = 0;
    d = 2;

    // 斐波那契数列的第40项
    while (d < 40) {
        c = a + b;
        a = b;
        b = c;

        d = d + 1;
    }

    if (c == 102334155) {
        pending = true;
    } else {
        pending = false;
    }
}
