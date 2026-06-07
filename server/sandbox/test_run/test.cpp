#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T;
    cin >> T;

    while (T--) {
        int N;
        long long X;
        cin >> N >> X;

        vector<long long> a(N);
        unordered_set<long long> seen;

        bool found = false;

        for (int i = 0; i < N; i++) {
            cin >> a[i];

            if (seen.count(X - a[i])) {
                found = true;
            }

            seen.insert(a[i]);
        }

        cout << (found ? "YES" : "NO") << '\n';
    }

    return 0;
}
